## Ovo Power Move Peak Percentage Calculator

The daily bookmarklet text file *[ovo-daily-usage-page-bookmarklet.txt](https://github.com/Tron-Burgundy/Ovo-Power-Move-Calculator/blob/main/ovo-daily-usage-page-bookmarklet.txt "ovo-daily-usage-page-bookmarklet.txt")* contains code you can paste into a browser bookmark which will show you a day's peak usage when clicked while viewing a day's usage on the Ovo site,

e.g. go to https://account.ovoenergy.com/usage?fuel=electricity&datePeriod=daily&unit=kwh&date=2024-03-27
click the bookmark and you'll get a result like

> 0.20 / 2.26 = 8.85%

The first figure is the total used during the peak slot, the second the total for the day and then the percentage used during the slot.

The [Monthly peak usage calculator bookmark](https://github.com/Tron-Burgundy/Ovo-Power-Move-Calculator/blob/main/ovo-monthly-calc-bookmarklet.txt) contains code you can **paste into a bookmark** that'll try and calculate your peak usage for entire months.  

To use it you must:

- Sign into your Ovo online account
- Click the bookmarklet which will show you a link to take you to the smartapi site
- Click the link shown onscreen.
- Click the bookmarklet again.  Now your calculations should happen.

If you click the bookmark and all the results are "NaN" then sign into your Ovo account again [The Ovo login page](https://my.ovoenergy.com/login) then click the bookmark again or refresh the page if it's open.

The [.js file](https://github.com/Tron-Burgundy/Ovo-Power-Move-Calculator/blob/main/ovo.monthly-peak-calculator.js) contains the un-minifed code for the month calculator.  If you press F12 on the [Smartapi site](https://smartpaymapi.ovoenergy.com/) you can paste the code for it into the console tab and run it like that rather than use a bookmark.

