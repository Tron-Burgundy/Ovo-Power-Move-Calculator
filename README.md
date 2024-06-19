## Ovo Power Move Peak Percentage Calculator

A one-click version of the [Monthly peak usage calculator bookmark](https://github.com/Tron-Burgundy/Ovo-Power-Move-Calculator/blob/main/ovo-ONE-CLICK-monthly-calc-bookmarklet.txt) is linked to here that has bank holiday info baked in.

Note that you can't get calculations earlier than June 23 or later than November 2024.  I'll more than likely update it before then to account for peak time changes.

To use any of these calculators copy the text and **paste that into a browser bookmark**, sign into your Ovo account and then click the bookmark.

The monthly calculator bookmarklet text file at 
[Two click monthly calculator](https://github.com/Tron-Burgundy/Ovo-Power-Move-Calculator/blob/main/ovo-FAST-calc-bookmarklet.txt)
will get up to date bank holiday information but the above version is a better alternative for now.

To use it sign into your Ovo account, click the bookmark, wait a sec then click it again.

If you click the bookmark and all the results are **"Not enough data"** then log out of your Ovo account and sign in again [The Ovo login page](https://my.ovoenergy.com/login) then click the bookmark again or refresh the page if it's open.

**Note:** zone in the link can be changed to "scotland" and "northern-ireland"

---

The **daily** bookmarklet text file *[ovo-daily-usage-page-bookmarklet.txt](https://github.com/Tron-Burgundy/Ovo-Power-Move-Calculator/blob/main/ovo-daily-usage-page-bookmarklet.txt "ovo-daily-usage-page-bookmarklet.txt")* contains code you can paste into a browser bookmark which will show you a day's peak usage when clicked while viewing a day's usage on the Ovo site,

e.g. go to https://account.ovoenergy.com/usage?fuel=electricity&datePeriod=daily&unit=kwh&date=2024-03-27
click the bookmark and you'll get a result like

> 0.20 / 2.26 = 8.85%

The first figure is the total used during the peak slot, the second the total for the day and then the percentage used during the slot.


The [.js file](https://github.com/Tron-Burgundy/Ovo-Power-Move-Calculator/blob/main/ovo.monthly-peak-calculator.js) contains the un-minifed code for the month calculator.  If you press F12 you can paste the code into console to run it that way.

