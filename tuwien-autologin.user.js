// ==UserScript==
// @name        TU Wien Autologin
// @namespace   https://vowi.fsinf.at/
// @include     https://tiss.tuwien.ac.at/*
// @include     https://tuwel.tuwien.ac.at/*
// @include     https://oc-presentation.ltcc.tuwien.ac.at/*
// @match       https://idp.zid.tuwien.ac.at/simplesaml/module.php/core/loginuserpass*
// @match       https://toss.fsinf.at/
// @match       https://memory.iguw.tuwien.ac.at/login
// @grant       GM_getValue
// @grant       GM_setValue
// @version     1.9
// @downloadURL https://fsinf.at/userscripts/tuwien-autologin.user.js
// @updateURL   https://fsinf.at/userscripts/tuwien-autologin.user.js
// @description Note: you need to have password auto fill-in enabled in your browser
// ==/UserScript==


(async () => {

  const DO_AUTO_TOTP = true;

  const TOTP_SECRET = GM_getValue('tuwien_totp_secret', null);

  // promt user to enter topt secret if not set
  if (DO_AUTO_TOTP && !TOTP_SECRET) {
    const secret = prompt('[AutoLogin] Enter your TOTP Base32 secret. Then reload.');
    if (secret?.trim()) {
      GM_setValue('tuwien_totp_secret', secret.trim());
      console.log('[AutoLogin] Secret saved! Reload the page.');
    } else {
      console.warn('[AutoLogin] No secret entered, aborting.');
    }
    return;
  }



function tuwelRefreshSession() {
  setTimeout(function() {
    fetch("https://tuwel.tuwien.ac.at/my/", {method: "HEAD"});
    tuwelRefreshSession();
  }, 15*60*1000);
}

async function openCastAutoLogin(){
	let response = await fetch('/info/me.json');
	if (response.ok){
		let info = await response.json();
		if (info.user.username == 'anonymous'){
			localStorage.returnURL = location.toString();
			window.location = 'https://tuwel.tuwien.ac.at/mod/lti/launch.php?id=385097';
		}
	}
}

switch(location.host){
	case 'idp.zid.tuwien.ac.at':
    setTimeout(async function() {
      if (document.querySelector('input[name="password"]').value) {

        if (DO_AUTO_TOTP) {
          var totp_field = document.querySelector('input#totp');

          const totp_code = await generateTOTP(TOTP_SECRET);

          totp_field.value = totp_code;
        }

   			document.querySelector('input[name="password"]').form.submit()

      } else {
        console.warn("Autologin-Script: PW field is empty. Is auto-fill enabled in browser?");
      }
    }, 500);

    break;


	case 'tiss.tuwien.ac.at':
		if (document.getElementsByClassName("loading").length > 0) {
			// Don't run the script on sites which only contain the loading animation.
			return;
		}

		login = document.querySelector(".toolLogin");
		if (login != null) {
			login.click();
		}
		break;

	case 'tuwel.tuwien.ac.at':
		if (location.pathname == "/login/index.php") {
      document.querySelectorAll('a').forEach(a => {
        if (a.textContent.trim() === 'TU Wien Login') {
          a.click();
        }
      });

		} else {
			tuwelRefreshSession();
		}
		break;

	case 'oc-presentation.ltcc.tuwien.ac.at':
		if (location.search == '?epFrom=d264f820-6d51-4cb1-a4f2-bb74e2094149&e=1&p=1' && localStorage.returnURL){
			let returnURL = localStorage.returnURL;
			localStorage.removeItem('returnURL');
			window.location	= returnURL;
		} else {
			openCastAutoLogin();
		}
		break;

	case 'toss.fsinf.at':
		hasTES = true;
		break;

	// Denki Schlüsselbegriff-Quiz
	case 'memory.iguw.tuwien.ac.at':
	if (location.pathname == "/login") {
		setTimeout(function() {
			document.querySelectorAll('button').forEach(button => {
				if (button.textContent.trim() === 'Mit TU Wien SSO anmelden') {
					button.click();
				}
			});
		}, 1000);
	}
	break;
  }


async function generateTOTP(base32Secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32Secret.toUpperCase().replace(/[\s=]+/g, '');

  // Decode Base32 to raw bytes
  let bits = '';
  for (const char of clean) {
    const val = alphabet.indexOf(char);
    if (val === -1) throw new Error('Invalid Base32 character: ' + char);
    bits += val.toString(2).padStart(5, '0');
  }
  const keyBytes = new Uint8Array(
    Array.from({ length: Math.floor(bits.length / 8) }, (_, i) =>
      parseInt(bits.slice(i * 8, i * 8 + 8), 2)
    )
  );

  // Counter = floor(unixTime / 30)
  const counter = Math.floor(Date.now() / 1000 / 30);
  const counterBytes = new Uint8Array(8);
  let tmp = counter;
  for (let i = 7; i >= 0; i--) { counterBytes[i] = tmp & 0xff; tmp = Math.floor(tmp / 256); }

  // HMAC-SHA1
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false, ['sign']
  );
  const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, counterBytes));

  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (
    ((hmac[offset]     & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) <<  8) |
     (hmac[offset + 3] & 0xff)
  ) % 1_000_000;

  return code.toString().padStart(6, '0');
}


})();
