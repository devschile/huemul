# Description:
#   Display pictures of pinceleart's girlfriend.
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Notes:
#   Anna   - Displays a Anna Kendrick picture

#
# Author:
#   @pinceleart

images = [
  "http://i.giphy.com/6DPqQoHys9uY8.gif",
  "http://i.giphy.com/QC0vfb8d7RiNO.gif",
  "http://i.giphy.com/xm60ctlv23fbO.gif",
  "http://i.imgur.com/6EaBLq6.gif",
  "https://media1.popsugar-assets.com/files/thumbor/L7fOIS9RN57NDmOEY84wSHb6isQ/fit-in/1024x1024/filters:format_auto-!!-:strip_icc-!!-/2014/01/30/843/n/1922398/21c2a90c1ab9aed8_tumblr_mfhfonwf671rg1b79o1_500/i/general-she-supercandid-relatable.gif",
  "http://i.imgur.com/OcBuB.gif",
  "http://k33.kn3.net/taringa/2/D/6/F/0/7/AnnaKendrick/58F.gif"
]

module.exports = (robot) ->
  robot.hear /anna/gi, (msg) ->
    msg.send msg.random images
