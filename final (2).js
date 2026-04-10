require('dotenv').config();
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

async function joinGoogleMeet() {
    console.log(`[${new Date().toLocaleString()}] Bot is starting to join the Google Meet...`);

    // __COOKIES_BEGIN__
    const googleCookies = [
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1786829030,
            "name": "__Secure-BUCKET",
            "value": "COoC",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": false,
            "expires": 1787342626,
            "name": "SEARCH_SAMESITE",
            "value": "CgQImqAB",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": false,
            "expires": 1808286781,
            "name": "SID",
            "value": "g.a0007wh16ESWHc8_C9tRp9xyRe-9ZkImhQAhCthyGdel_SjwmCm_X6en_0X_jqBkCySk6rMtLAACgYKAZESARMSFQHGX2MipFlPTe_PqGBviaLUAK4wkRoVAUF8yKp4zk5BsxSCwGXkU8Y0oEwX0076",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1808286781,
            "name": "__Secure-1PSID",
            "value": "g.a0007wh16ESWHc8_C9tRp9xyRe-9ZkImhQAhCthyGdel_SjwmCm_-QQXWlcHjgpZQpP0Aq4d8QACgYKAegSARMSFQHGX2MiW1SBB_CBmIqPVILIaiFfHRoVAUF8yKotTSILEald-n_Y8dmELKtC0076",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1808286781,
            "name": "__Secure-3PSID",
            "value": "g.a0007wh16ESWHc8_C9tRp9xyRe-9ZkImhQAhCthyGdel_SjwmCm_knkBW2K5PGwQoNR5EdAv5wACgYKAXUSARMSFQHGX2MiZuMosHAkd0kTEybPHLW4-RoVAUF8yKqdMACMad6D6jk2gerZWZeK0076",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": false,
            "expires": 1808286781,
            "name": "HSID",
            "value": "A1IIiGMSd5Mg7gYbg",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1808286781,
            "name": "SSID",
            "value": "ADcb62vN_NYD4WCfR",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": false,
            "expires": 1808286781,
            "name": "APISID",
            "value": "AO6EMbTtm4Azf4DI/ArUuv52oYQF0RbRzp",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1808286781,
            "name": "SAPISID",
            "value": "U23bL9G3ZeA4IWHr/AfidWlnxfZmM9xblo",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1808286781,
            "name": "__Secure-1PAPISID",
            "value": "U23bL9G3ZeA4IWHr/AfidWlnxfZmM9xblo",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1808286781,
            "name": "__Secure-3PAPISID",
            "value": "U23bL9G3ZeA4IWHr/AfidWlnxfZmM9xblo",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1786829029,
            "name": "AEC",
            "value": "AaJma5vxCnKZieOFjDmO8tsKMzSPtk702gz7NcvP3KWgtIhBZe7IvYnFpQ",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": "meet.google.com",
            "path": "/",
            "secure": true,
            "expires": 1810331530,
            "name": "OSID",
            "value": "g.a0008wh16KGT2xG7AtJnLxcXE_2_4jlex1RZ14xFr22vB7nf6MCl-vmyYP84iMZ9gHs4BqCMsQACgYKAaASARMSFQHGX2MiNNNaqmTRjtFXvWCtx_pHZhoVAUF8yKqxz3FAR_yYw0G1abbpQZ0E0076",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": "meet.google.com",
            "path": "/",
            "secure": true,
            "expires": 1810331530,
            "name": "__Secure-OSID",
            "value": "g.a0008wh16KGT2xG7AtJnLxcXE_2_4jlex1RZ14xFr22vB7nf6MClbKtot-QEAN1XltE91bDUrgACgYKASESARMSFQHGX2MiA6zLTUx5xOrPKHpM6C92NhoVAUF8yKoPA46adw_sQsUiik1MEy1b0076",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": "meet.google.com",
            "path": "/",
            "secure": true,
            "expires": 1778384095,
            "name": "OTZ",
            "value": "8558135_34_34__34_",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1791534316,
            "name": "NID",
            "value": "530=DXtdVJsIyQb3Y46MMEkBX2OnyeuXowF_S4TlYWpzLEq9uMugDz760Vzzl_jkCd_M8kv9eiRyjDwIbJIl94m7129kiYUXfFQMj1dep6rlgO-2skm7M2la10fZWLU2XbkjsTYx_5IBn9fdNqp2L9WshH91DQFo6AbLeS13yiYdojDJvvLzF4pg9kaU5FERSWg8LSMOzDTdwa0GZ4VeemAIFgZ31YdDnEO06toAEWfiFWe7dgiLw3Pyad_yhxmfmK_om51poLzSMb9374JnrcFiOe0HN6jTnEUkimszzEikgUDQ-R-vM0JAebjhMrIDxL7uG7tBS5DnSJn1u03HJHWKW4A0nx0ZUEI35N4AQmg-OHoFTD3qnR2MwpFlHeamJtp6nAMA04Xx-NF_N25nPfSM-GVQH6d8hND113sbXS_71KKIwjBx2kpcTjZtnVCtOfJxG5carc94E5bBBN5GeclidGWIIMs8WYDrnaAh7SYdJ70fTMzCG6WJCtX8q0MaX8aykDZpCjErQxf05RNb1QthNoX7KG7oLwGpPVt0ZXRpN4lyFBk5cqnCouHVRrePWHVqLFtFWR1rFPrRkfUumGoQmFAsVpKYoWKrs_LU2oRU5kujm3Yx9P6ZbMcxdaFMcCDBTasN_7usY4064Anu2EXRcbyOaehfH7Ub5t2QB4Gewc1DZUexorAQs1W7zd4_l2gKhFeJGoq16kVw0E7o-pmUrdAJB0HPI8bDZmNh1OR0ONoS8jtTYJ-gP4EjQykX8ljTuxu8zbHGrTxo7DwfdlaohNzqJl1bcGoddnlayKxJKSw",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1807336601,
            "name": "__Secure-1PSIDTS",
            "value": "sidts-CjIBWhotCdL-7i7jiSxAgaMBgPJ1ur9QwThAlB5S1TilwnjFyxBFPFyYN0Jf01Df3lY8uBAA",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1807336601,
            "name": "__Secure-3PSIDTS",
            "value": "sidts-CjIBWhotCdL-7i7jiSxAgaMBgPJ1ur9QwThAlB5S1TilwnjFyxBFPFyYN0Jf01Df3lY8uBAA",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1775801104,
            "name": "__Secure-STRP",
            "value": "AEEP7gIfAroX8JJhZmWMuszJuNGhjmeM0BNUoITZ4R0tyVs_XVZw9c5GE92uyQ6mL2U2lQKUoNIpoajBcnsGIPnyBAZKop0bhGT-",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": false,
            "expires": 1807336811,
            "name": "SIDCC",
            "value": "AKEyXzXSTfnnE-wWft32lozrDMnMAd4g3b3_BxnbzCkLJUnCCsDL7lRS5qn8gELOsjqPS4ry12c",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1807336811,
            "name": "__Secure-1PSIDCC",
            "value": "AKEyXzUKVsS0SRHd2PqStdJBhrtAfrkCvq7zph2Ynt7wt62Je-wxYjNu2WCzC5Smbt3mUBWLzsg",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1807336811,
            "name": "__Secure-3PSIDCC",
            "value": "AKEyXzWJ_V1i1s9Oc4nCHEgQYrIdXLh7lyWKdnqncDUTnICpyYiXlP7OGAUpkuJOMpGiR3V59xk",
            "sameSite": "Lax",
            "httpOnly": false
        }
    ];
// __COOKIES_END__

    // Use a persistent profile folder
    const userDataDir = '/tmp/meet-bot-' + Date.now();

    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: true,            // Run in background
        channel: 'chrome',
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        permissions: ['camera', 'microphone'],
        ignoreDefaultArgs: ['--enable-automation'],
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--use-fake-ui-for-media-stream'
        ]
    });

    const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

    // Extra stealth
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    try {
        // === COOKIE INJECTION ===
        console.log('Injecting session cookies directly...');
        await context.addCookies(googleCookies);
        console.log('✅ Cookies injected successfully.');

        // === Go to Meet Link ===
        console.log('Opening Google Meet...');
        await page.goto(process.env.MEET_LINK, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for any join-ready elements instead of a fixed 10s delay
        console.log('Waiting for meeting UI...');
        const readySelector = 'div[aria-label*="camera"], button:has-text("Join now"), button:has-text("Ask to join"), input[type="text"]';
        await page.waitForSelector(readySelector, { timeout: 15000 }).catch(() => console.log('UI loading slowly, proceeding anyway...'));

        // Handle camera/mic and join-request in quick succession
        console.log('Finalizing join settings...');

        // Set bot name if input exists
        const nameInput = page.locator('input[type="text"], [placeholder*="name"]').first();
        if (await nameInput.isVisible({ timeout: 2000 })) {
            console.log('Entering bot name...');
            await nameInput.fill(process.env.BOT_NAME);
            await nameInput.press('Enter');
        }

        // Final Join Click
        console.log('Requesting to join...');
        const joinSelectors = ['button:has-text("Ask to join")', 'button:has-text("Join now")', 'span:has-text("Ask to join")', 'span:has-text("Join now")'];

        let joined = false;
        for (const selector of joinSelectors) {
            try {
                const btn = page.locator(selector).first();
                if (await btn.isVisible({ timeout: 2000 })) {
                    await btn.click();
                    console.log(`✅ Clicked join via: ${selector}`);
                    joined = true;
                    break;
                }
            } catch (e) { }
        }

        if (joined) {
            console.log('Waiting to be admitted to the meeting...');
            try {
                await page.waitForSelector('button[aria-label="Leave call"], button[aria-label="Leave Meeting"]', { timeout: 60000 });
                console.log('✅ Successfully admitted to the meeting.');
            } catch (e) {
                console.log('⚠️ Timed out waiting to be admitted or "Leave call" button not found. Proceeding anyway...');
            }
        } else {
            console.log('⚠️ Could not find join button, attempting to continue anyway...');
        }

        console.log(`✅ Bot processed join at ${new Date().toLocaleTimeString()}`);
        console.log('Bot is active in background.');

    } catch (error) {
        console.error('❌ Error joining meeting:', error.message);
        await context.close();
    }
}

// ======================
// Run immediately
// ======================
joinGoogleMeet();