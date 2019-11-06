require( "dotenv" ).config();

require('isomorphic-fetch');
const gsheets = require( "gsheets" );

// https://docs.google.com/forms/d/<form-id>/edit

var formId = process.env.FORMID;
const fetch = require('node-fetch');

async function submitForm( name, type, tip ) {
  try {
    const body = new URLSearchParams({
      'entry.326169323': name,
      'entry.983220439': type,
      'entry.571649675': tip
    });

    var res = await fetch( `https://docs.google.com/forms/d/e/${formId}/formResponse`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })
    return res.ok || false;
  }
  catch( err ) {
    return false;
  }
}

let tipsNtricks = [];
let cleaningTips = [];

function getRandomInt( num ) {
  return Math.floor( num * Math.random() );
}

function refreshTips() {
  gsheets.getWorksheet(process.env.SHEETID, 'Form Responses 1')
    .then( res => {
      // console.log( res.updated );
      // console.log( res.title );
      tipsNtricks = res.data.map( r => {
        return {
          date: new Date( ( r.Timestamp - ( 25567 + 1 ) ) * 86400 * 1000 ), // CodingGarden: (Looking up StackOverflow) This is whats happening: 1. Subtract number of days between Jan 1, 1900 and Jan 1, 1970, plus 1 (Google "excel leap year bug") 2. Convert to milliseconds.
          name: r[ "Name (Twitch Username)" ],
          category: r[ "What type of Tip/Trick Is It?" ],
          tip: r[ "Your Tip/Trick!" ]
        };
      });
      cleaningTips = tipsNtricks.filter( x => x.category === "Cleaning" );
      // console.log( cleaningTips );
    }, err => console.error(err));
}

refreshTips();

const ComfyClock = require( "comfyclock" );
ComfyClock.Every[ "15 minutes" ] = ( date ) => {
  refreshTips();
};

const ComfyJS = require( "comfy.js" );
ComfyJS.onCommand = async ( user, command, message ) => {
  if( command === "cleantip" || command === "clean" ) {
    let randomTip = cleaningTips[ getRandomInt( cleaningTips.length ) ];
    ComfyJS.Say( "/me Cleaning Tip: \"" + randomTip.tip + "\" -" + ( randomTip.name || "Anonymous" ) );
  }
  if( command === "addcleantip" || command === "addclean" ) {
    var res = await submitForm( user, "Cleaning", message );
    if( res ) {
      ComfyJS.Say( `/me @${user} Added! Thank you!` );
    }
    else {
      ComfyJS.Say( `/me @${user} Oops, something went wrong` );
    }
  }
};
ComfyJS.Init( process.env.TWITCHUSER, process.env.OAUTH );

const ComfyDiscord = require( "comfydiscord" );
ComfyDiscord.onCommand = async ( channel, user, command, message, flags, extra ) => {
  // if( channel === "discordbotjam" ) {
    if( command === "cleantip" || command == "clean" ) {
      let randomTip = cleaningTips[ getRandomInt( cleaningTips.length ) ];
      ComfyDiscord.Say( channel, "Cleaning Tip: \"" + randomTip.tip + "\" -" + ( randomTip.name || "Anonymous" ) );
    }
    if( command === "addcleantip" || command === "addclean" ) {
      var res = await submitForm( user, "Cleaning", message );
      if( res ) {
        ComfyDiscord.Say( channel, `<@${extra.userId}> Added! Thank you!` );
      }
      else {
        ComfyDiscord.Say( channel, `<@${extra.userId}> Oops, something went wrong` );
      }
    }
  // }
}
ComfyDiscord.Init( process.env.DISCORDTOKEN );
