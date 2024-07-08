/*  "One click" version of the script that has baked in bank holiday data

    July 2024 Update as weekends count as off peak

    Bank holiday data good for 2024 up to DEC 23rd
*/
"use strict"
{
let zone = "england-and-wales";// scotland northern-ireland
const MONTHS_TO_CALC = 4;   // how far to go back.  Don't go back earlier than 2023-06-01
    // dates useful to December 24.  I'll have to edit by then for the next set of peak hours
let bhdates = {"2024-01-01":"New Year’s Day","2024-03-29":"Good Friday","2024-04-01":"Easter Monday","2024-05-06":"Early May bank holiday","2024-05-27":"Spring bank holiday","2024-08-26":"Summer bank holiday"};

let API_URL = "https://smartpaymapi.ovoenergy.com/usage/api/half-hourly/";
const OVO_RETURN_URL    = "https://account.ovoenergy.com/usage?fuel=electricity";

let l = console.log;
let pad = a => ("0"+a).slice(-2);
let gid = x=>document.getElementById(x);

let errLgin = x => o('[<a href="https://account.ovoenergy.com/">CLICK HERE to sign into your Ovo account</a>] <b>then click the bookmark again.</b>');

let spx = 0;    // spinner on/off state
let xDiv, acctid;   // spinner div

(async ()=>{
    if (window.location.host !== "account.ovoenergy.com") {
        window.location.href = OVO_RETURN_URL;
        return;
    }

    setup_divs();

    if (!set_acct_num()) {
        errLgin();
        return;
    }

    o("Press F12 for more info");
    l("Account id is fine");

    API_URL = API_URL + acctid + "?date=";

    for(let m = 0; m < MONTHS_TO_CALC; m++)
        await main(m);
})();



    // summing function for entire day's energy
function get_day_tot(jData) {
    let dayTot = 0;
    for ( let halfHrIdx = 0; halfHrIdx < jData.length; halfHrIdx++) {
        dayTot += jData[halfHrIdx].consumption;
    }
    return dayTot;
}


    /* The calculator for each month */


async function main(monthsInPast = 0) {
    let fdld = firstday_lastday(monthsInPast);

    let totalMthPeak = 0, totalMthAll = 0;
    let dow = fdld.firstDayOfMonth;    // day of week = first day of month
    let year = fdld.year;
    let month = pad(fdld.month);
    let bhDays = 0;
    let bhShow = [];
    let daysFailed = 0;
    let dataContinues = true;   // "next" field of result specifies if there are remaining days

    l("Month: ", fdld.mthName);
    o(`Month: ${fdld.mthName} ${fdld.year}, peak hours: ${fdld.peakTimeStart} to ${fdld.peakTimeEnd}`);

        // summing fn for day's peak energy
    let get_peak_tot = jData => {
        let peakTot = 0;
        for ( let halfHrIdx = 0; halfHrIdx < jData.length; halfHrIdx++) {
            let halfHourToDate = new Date(jData[halfHrIdx].interval.start);
            let halfHourHour = halfHourToDate.getHours();
            if (halfHourToDate.getTimezoneOffset() != 0) halfHourHour++;

            if (halfHourHour >= fdld.peakTimeStart && halfHourHour < fdld.peakTimeEnd) {
                peakTot += jData[halfHrIdx].consumption;
            }
        }
        return peakTot;
    }

        // loop through the month
    for (let i = 1; i <= fdld.lastDayOfMonth && dataContinues; i++, dow = ++dow%7) {
        if (new Date(fdld.year, fdld.month-1, i) >= Date.now()) {
            l("Ending calcs for the month.  Date is >= today", Date.now(), new Date(fdld.year, fdld.month-1, i));
            break;
        }

        let dateToString = `${year}-${month}-`+pad(i);
        let dataUrl = API_URL + dateToString;
        let data = await fetch(dataUrl, { credentials: "include" });

        if (data.ok !== true) {
            daysFailed++;
            l("bad response for", dataUrl)
            continue;
        }

        spin();
        let json = await data.json();
            // so far next=false occurs on pages with an empty data=[] array for electricity
        dataContinues = json?.electricity?.next ?? false;
        if (!dataContinues) l("DATA ENDS for the month " + dateToString);

        if (! json.electricity) {
            l("No electricity data for " + dateToString);
            continue;
        }

        let ed = json.electricity.data;

        if (ed instanceof Array === false || ed.length === 0) {
            daysFailed++;
            l("1/2 hourly data is empty or not an array", ed);
            continue;
        }

        if (ed.length != 48) {
            l(dateToString, "1/2 hourly data length not 48: ", ed.length);
        }

            // NOTE: bank holidays are ditched.  They don't count to off-peak

        if ( bhdates[dateToString] ) {
            l(dateToString + " bank holiday " + bhdates[dateToString]);
            bhDays++;
            bhShow.push(bhdates[dateToString]);
            // once clarified know whether to add if (bhOffpeakCounted) totalMthAll += get_day_tot(ed);
        }
        else // weekends
        if ( dow === 0 || dow === 6 ) { // ignore if pre July 24
            if (fdld.weekendsCountOffpeak) {
                totalMthAll += get_day_tot(ed);
                l("Weekend counts as offpeak: " + get_day_tot(ed));
            }
        }
        else
        {
            let dayPeakTot = get_peak_tot(ed);
            let dayTot = get_day_tot(ed);

            totalMthAll += dayTot;
            totalMthPeak+= dayPeakTot;
            if (dayTot > 0.0)
                l(`${pad(i)} day ${(100 * dayPeakTot / dayTot).toFixed(3)}%  [${dayPeakTot.toFixed(3)}/${dayTot.toFixed(3)}]`);
        }
    }

    let mPercent = totalMthAll > 0 ? (totalMthPeak / totalMthAll * 100).toFixed(2) + "%": "Not enough data yet...";
    let lm = `TOTAL = ${mPercent}  [${totalMthPeak.toFixed(3)} / ${totalMthAll.toFixed(3)}]kWh - bank holidays: ${bhDays} `+bhShow.join(", ");
    l(lm);l();
    o(lm); o("&nbsp;");
}

function firstday_lastday(mthOffset = 0) {
    let date = new Date();
        // note zero based, 3 is April
    let first = new Date(date.getFullYear(), date.getMonth() - mthOffset, 1);
    let last = new Date(date.getFullYear(), date.getMonth() - mthOffset + 1, 0);

    let [peakTimeStart, peakTimeEnd] = first >= new Date(2024,3) ? [18,21] : [16,19];
    // from July 2024 weekends count as offpeak
    let weekendsCountOffpeak = first >= new Date(2024, 6); // 0 = Jan

    return  {
        firstDayOfMonth: first.getDay(),
        lastDayOfMonth: last.getDate(),
        month: first.getMonth() + 1,
        mthName: first.toLocaleString('default', { month: 'long' }), year: first.getFullYear(),
        peakTimeStart,
        peakTimeEnd,
        weekendsCountOffpeak
    }
}

function set_acct_num(){
    let c = Object.fromEntries(document.cookie.split('; ').map(c => c.split('=')));
    let v = c.mp_457e7322cdf0dcb51030b6a3bafd8805_mixpanel;
    if (v !== undefined) {
        let acct = JSON.parse( decodeURIComponent(v) )
        acctid = acct["Account Id"];
        if (acctid)
            return true;
    }
    return false;
}

function o() {
    for(let q of arguments){
        let nd = document.createElement("div"); nd.innerHTML = q;
        msgs.append(nd);
    }
}

function setup_divs(){
    document.body.innerHTML = '<div>Working: [<span id="X">+</span>]<p><div id="msgs"></div></div>';
    //mDiv=gid("msgs");
    xDiv = gid("X");
}

function spin() {
    spx=!spx;
    xDiv.innerText = spx?'◉':"◎";
}

}
