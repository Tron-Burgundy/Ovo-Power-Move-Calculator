let zone = "england-and-wales";// scotland northern-ireland
let l = console.log;
let pad = a => ("0"+a).slice(-2);
let gid = x=>document.getElementById(x);
let bhdates=[]; let bhEvents = {};
let spx=0;
let url = "https://smartpaymapi.ovoenergy.com/usage/api/half-hourly/";
let errLgin = x => o('<b>ERROR:</b> [<a href="https://account.ovoenergy.com/">CLICK HERE to sign into your Ovo account first.</a>]');
let errLoc = x => o('<b>ERROR:</b> <a href="https://smartpaymapi.ovoenergy.com/">CLICK HERE to go to the website</a> then ignore the onscreen message and use the bookmark again.');

const MONTHS_TO_CALC = 4;

(async ()=>{
    setup();

    if (!set_acct_num()) {errLgin(); return;}
    if (window.location.host != "smartpaymapi.ovoenergy.com") {errLoc(); return;}

    url=url+acctid+"?date=";

    try {
        let bhr = await fetch("https://www.gov.uk/bank-holidays.json");
        if (bhr.ok) {
            let bh = await bhr.json();
            for (let d of bh[zone].events) {
                bhdates.push(d.date);
                bhEvents[d.date] = d.title;
            }
            l("got bank holidays")
        }
    } catch (e) {
        o("Can't process bank holidays")
    }

    o("Press F12 for more info");
    for(let m=0; m<MONTHS_TO_CALC; m++)
        await main(m);
})();

async function main(mPast=0) {
    let fdld = firstday_lastday(mPast);

    let total427 = 0; total = 0;
    let dow=fdld.fdom;
    let year=fdld.year;
    let month=pad(fdld.month);
    let bhDays = 0;
    let bhShow = [];
    //let daysUsedToCalc = 0;
    let daysFailed = 0;
    let dataContinues = true;   // next field of result specifies if there are remaining days

    l("Month: ", fdld.mthName);
    o("Month: "+fdld.mthName+" "+fdld.year+ ",  peak hours : " + fdld.peakTimeStart + " to " + fdld.peakTimeEnd);

    for (i = 1; i <= fdld.ldom && dataContinues; i++, dow = ++dow%7) {
        if (new Date(fdld.year, fdld.month-1, i) >= Date.now()) {
            console.log("Ending calcs for the month.  Date is >= today", Date.now(), new Date(fdld.year, fdld.month-1, i));
            break;
        }

        dts = `${year}-${month}-`+pad(i);

        let furl=url+dts;
        data = await fetch(furl);   // ok: true or status: 200 check
        if (data.ok !== true) {
            daysFailed++;
            l("bad response for", furl)
            continue;
        }

        spin();
        let json = await data.json();

        dataContinues = (json.electricity !== undefined && json.electicity !== null && undefined !== json.electricity.next) ? json.electricity.next : false;
        if (!dataContinues) console.log("DATA ENDS for the month "+dts);

        if (dow>0 && dow<6) {
            if (bhdates.includes(dts)) {
                l(dts + " bank holiday " + bhEvents[dts]);
                bhDays++;
                bhShow.push(bhEvents[dts]);
                // javascript STILL NEEDS to be checked for next
                continue;
            }
            //daysUsedToCalc++;

            if (json.electricity) {
                let ed = json.electricity.data;

                if (ed instanceof Array == false) {
                    daysFailed++;
                    l("1/2 hourly data is not an array", ed);
                    continue;
                }
                if (ed.length != 48) {
                    l(dts, "1/2 hourly data length not 48: ", ed.length);
                }
                e427Tot = 0; dayTot = 0;
                for(let hh=0; hh<ed.length; hh++) {
                    dayTot+=ed[hh].consumption;
                    let d2d = new Date(ed[hh].interval.start);
                    let tsh = d2d.getHours();
                    if (d2d.getTimezoneOffset() != 0) tsh++;
                    if (tsh >= fdld.peakTimeStart && tsh < fdld.peakTimeEnd)
                        e427Tot+=ed[hh].consumption;
                }
                total += dayTot; total427+=e427Tot;
                l(`${pad(i)} day ${(100 * e427Tot / dayTot).toFixed(3)}%  [${e427Tot.toFixed(3)}/${dayTot.toFixed(3)}]`);
                if (json.electricity.next !== true)
                    break;
            } else l("Nooo for " + dts);
        }
    }
    let mPercent = total > 0 ? (total427/total * 100).toFixed(2) + "%": "Not enough data yet...";
    let lm = `TOTAL = ${mPercent}  [${total427.toFixed(3)} / ${total.toFixed(3)}]kWh - bank holidays: ${bhDays} `+bhShow.join(", ");
    l(lm);l();
    o(lm); o("&nbsp;");
}

function firstday_lastday(mthOffset = 0) {
    let date = new Date();
        // note zero based, 3 is April
    let first = new Date(date.getFullYear(), date.getMonth() - mthOffset, 1);
    let last = new Date(date.getFullYear(), date.getMonth() - mthOffset + 1, 0);

    let [peakTimeStart, peakTimeEnd] = first >= new Date(2024,3) ? [18,21] : [16,19];

    let p =  {
        fdom: first.getDay(),
        ldom: last.getDate(),
        month: first.getMonth() + 1,
        mthName: first.toLocaleString('default', { month: 'long' }), year: first.getFullYear(),
        peakTimeStart,
        peakTimeEnd
    }
    return p;
}

function set_acct_num(){
    let c = Object.fromEntries(document.cookie.split('; ').map(c => c.split('=')));
    let v = c.mp_457e7322cdf0dcb51030b6a3bafd8805_mixpanel;
    if (v !== undefined) {
        acct = JSON.parse( decodeURIComponent(v) )
        acctid = acct["Account Id"];
        if (acctid)
            return true;
    }
    return false;
}

function o() {
    for(let q of arguments){
        nd=document.createElement("div"); nd.innerHTML=q;
        msgs.append(nd);
    }
}

function setup(){
    document.body.innerHTML = '<div>Working: [<span id="X">+</span>]<p><div id="msgs"></div></div>';
    mDiv=gid("msgs");
    xDiv=gid("X");
}

function spin() {
    spx=!spx;
    xDiv.innerText = spx?'◉':"◎";
}
