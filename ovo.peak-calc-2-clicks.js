/*
    "Two Click" version of the code that if it can't grab bank holiday data will relocate
    to a site that populates the url with a json version

    https://codebeautify.org/minify-js for minification
*/
"use strict"
{
let REGION = "england-and-wales";// scotland northern-ireland
let bhdates = {};   // globa and is side-effect loaded for programming bad-practice reasons
const MONTHS_TO_CALC = 4;   // how far to go back.  Don't go too far back as the data is not available for all months

// 2 Step Bank Holiday setup

async function bank_holiday_check() {
    const BH_SITE_PROXY     = "https://twitch-tools.glitch.me/ovo.html?months="+MONTHS_TO_CALC;

    bhdates = dates_from_url_params() || await fetch_gov_bank_holidays(MONTHS_TO_CALC, REGION);

    if (bhdates && window.location.host == "account.ovoenergy.com") {
        return true;
    }
        // redirect to remote if no data available
    window.location.href = BH_SITE_PROXY;
    return false;
}

/*
    Returns obj of bank holidays from fetched json
*/

async function fetch_gov_bank_holidays(months2Calc = 4, region = "england-and-wales") {
    const BH_JSON_URL = "https://www.gov.uk/bank-holidays.json";

    let dateHi = new Date();
    let dateLow = new Date();
    dateLow.setMonth( dateLow.getMonth() - months2Calc - 1 );
    dateHi.setMonth( dateHi.getMonth() + 1 );

    let dates = {};

    try {
        let bhr = await fetch(BH_JSON_URL);

        if (bhr.ok) {
            let bh = await bhr.json();
            for (let d of bh[region].events) {
                let dobh = new Date(d.date);
                if (dobh > dateLow && dobh < dateHi)
                    dates[d.date] = d.title;
            }
            // l("got bank holidays from JSON")
            return dates;
        }
    } catch (e) {
        //o("<div>&nbsp;</div><b>Can't process bank holidays directly...</b>");
        console.log("ERROR fetching: ", e);
    }

    return false
}

    // fills global bhdates[] with data from url params returns bool

function dates_from_url_params() {
    let qs = new window.URLSearchParams( window.location.search );
    let param = qs.get("bh");

    if (param === null)
        return false;

        // are bank holidays in the thing
    try {
        return JSON.parse(param);
        // o("SUCCESS: Got bank holidays from URL params.");
    } catch (error) {
        o("ERROR getting the bank holidays from the URL");
        return false;
    }

    return true;
}

////////////////////////////////////////////////////////////////
///////////////////// COMMON CODE///////////////////////////////
////////////////////////////////////////////////////////////////


function peak_hours(firstDayOfMonth) {
    let [peakTimeStart, peakTimeEnd] = [16, 19]; // default
    let weekendsCountOffpeak = false;
        // when adding new dates put newer dates at the top or add between date values remembering months start at zero.
        // e.g. firstDayOfMonth >= new Date(2025, 1) && firstDayOfMonth < new Date(2025, 4)
    switch (true) {
        case firstDayOfMonth >= new Date(2025, 1): // feb 25 and onward
        [peakTimeStart, peakTimeEnd] = [17, 19];
        break;

        case firstDayOfMonth >= new Date(2024, 9): // oct
        [peakTimeStart, peakTimeEnd] = [16, 19];
        break;

        case firstDayOfMonth >= new Date(2024, 3): // apr
        [peakTimeStart, peakTimeEnd] = [18, 21];
        break;
    }
        // Weekends count offpeak?  rules as for dates above
    switch(true) {
        case firstDayOfMonth >= new Date(2024, 6): // and an && < some other date when then rules change
            weekendsCountOffpeak = true; break;
    }

    return {peakTimeStart, peakTimeEnd, weekendsCountOffpeak}
}

let API_URL = "https://smartpaymapi.ovoenergy.com/usage/api/half-hourly/";

let l = console.log;
let pad = a => ("0" + a).slice(-2);
let gid = x => document.getElementById(x);


let errLgin = x => o('[<a href="https://account.ovoenergy.com/">CLICK HERE to sign into your Ovo account</a>] <b>then click the bookmark again.</b><h2>Do not use private browsing</h2>');

let spx = 0;    // spinner on/off state
let xDiv, acctid;   // spinner div

(async () => {
    setup_divs();

    if (false == await bank_holiday_check())
        return;

    if (!set_acct_num()) {
        errLgin();
        return;
    }

    o("Press F12 for more info");
    l("Account id is fine");

    API_URL = API_URL + acctid + "?date=";

    for (let m = 0; m < MONTHS_TO_CALC; m++)
        await main(m);
})();



// summing function for entire day's energy
function get_day_tot(jData) {
    let dayTot = 0;
    for (let halfHrIdx = 0; halfHrIdx < jData.length; halfHrIdx++) {
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
        for (let halfHrIdx = 0; halfHrIdx < jData.length; halfHrIdx++) {
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
    for (let i = 1; i <= fdld.lastDayOfMonth && dataContinues; i++, dow = ++dow % 7) {
        if (new Date(fdld.year, fdld.month - 1, i) >= Date.now()) {
            l("Ending calcs for the month.  Date is >= today", Date.now(), new Date(fdld.year, fdld.month - 1, i));
            break;
        }

        let dateToString = `${year}-${month}-` + pad(i);
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

        if (!json.electricity) {
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

        if (bhdates[dateToString]) {
            l(dateToString + " bank holiday " + bhdates[dateToString]);
            bhDays++;
            bhShow.push(bhdates[dateToString]);
            // once clarified know whether to add if (bhOffpeakCounted) totalMthAll += get_day_tot(ed);
        }
        else // weekends
            if (dow === 0 || dow === 6) { // ignore if pre July 24
                if (fdld.weekendsCountOffpeak) {
                    totalMthAll += get_day_tot(ed);
                    l("Weekend counts as offpeak: " + get_day_tot(ed));
                }
            }
            else {
                let dayPeakTot = get_peak_tot(ed);
                let dayTot = get_day_tot(ed);

                totalMthAll += dayTot;
                totalMthPeak += dayPeakTot;
                if (dayTot > 0.0)
                    l(`${pad(i)} day ${(100 * dayPeakTot / dayTot).toFixed(3)}%  [${dayPeakTot.toFixed(3)}/${dayTot.toFixed(3)}]`);
            }

        if (!dataContinues) l("DATA ENDS for the month " + dateToString);
    }

    let mPercent = totalMthAll > 0 ? (totalMthPeak / totalMthAll * 100).toFixed(2) + "%" : "Not enough data yet...";
    let lm = `TOTAL = ${mPercent}  [${totalMthPeak.toFixed(3)} / ${totalMthAll.toFixed(3)}]kWh - bank holidays: ${bhDays} ` + bhShow.join(", ");
    l(lm); l();
    o(lm); o("&nbsp;");
}

// oct 24 back to 16,19 but weekends count

function firstday_lastday(mthOffset = 0) {
    let date = new Date();
    // note zero based, 3 is April
    let first = new Date(date.getFullYear(), date.getMonth() - mthOffset, 1);
    let last = new Date(date.getFullYear(), date.getMonth() - mthOffset + 1, 0);

    let {peakTimeStart, peakTimeEnd, weekendsCountOffpeak} = peak_hours(first);

    return {
        firstDayOfMonth: first.getDay(),
        lastDayOfMonth: last.getDate(),
        month: first.getMonth() + 1,
        mthName: first.toLocaleString('default', { month: 'long' }), year: first.getFullYear(),
        peakTimeStart,
        peakTimeEnd,
        weekendsCountOffpeak
    }
}

function set_acct_num() {
    let c = Object.fromEntries(document.cookie.split('; ').map(c => c.split('=')));
    let v = c.mp_457e7322cdf0dcb51030b6a3bafd8805_mixpanel;
    if (v !== undefined) {
        let acct = JSON.parse(decodeURIComponent(v))
        acctid = acct["Account Id"];
        if (acctid)
            return true;
    }
    return false;
}
    // Simple output adds to the messages div
function o() {
    for (let q of arguments) {
        let nd = document.createElement("div"); nd.innerHTML = q;
        msgs.append(nd);
    }
}

function setup_divs() {
    document.body.innerHTML = '<div style="padding: 1em">Working: [<span id="X">+</span>]<p><div id="msgs"></div></div>';
    //mDiv=gid("msgs");
    xDiv = gid("X");
}

function spin() {
    spx = !spx;
    xDiv.innerText = spx ? '◉' : "◎";
}
}
