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
            "expires": 1791534315,
            "name": "NID",
            "value": "530=BfdOmdA-dISZfsn-V7v3K2gSQoHjoOVNjVsgus8KcW7KkfZvOm3omWuKM9DEH1PxRk6eBRKY0WW-zvj3qh9fMA7Nuw7y_0N7bk2zH4GkPWiVV9c4cSkl3KjtaKiAyalrCw4ZPRIv5DLFiT6Dagt8jgMRFZuS7FSKRWE6kOWmQNY1qP_0QChk07weqolAy5UNKlPxXZRAYS9gP6UbQkHk84BV5BpOqcujGQJ0ib-6Z5sFaNYN151zF6ztTTB9ZJS5clWJYHHZ2MypUq03QBytlW8WlF-XFiN50G2sAwMZYbuBaLbfcGa9GVeVbFaJCU_nXr60N3SNM4HanLRFYSQfjQhCVP2VAIXfhpx9-_wUlLS_lh19uQ-KEqnCNr0lN0Oc6yyIoypHDQztipfjFtXBj07iCb1sknCI9E_zo4ozhlhlhxory1ZGqTFT1Cs1BUgXVlEIwgyBohLkeKuC5ykArU7RzdNe9gkfWny-7WoZbBtn6FufN-7x8uwNi03ruXgzqNKBU0Z4AfGW_7nJbXnplYoyPvpbDXS1HehuAvQIhfbilcGFdSRUzoSBzT3tHC1GduP3npttaKZIzMQr1fNRIR4O0YYJVFs1SG33nT8lFV3XpjjuzYIL0mjhZb_SOyWHuHku6hCL0_CbhaImrBfMDP5ydCq_PSyhYcrg15F2rBOALxJ2CcAkPsuhHKz8Me2uTyAQqZ7S64v_etgOnbBOBv2w4gDzUAyd8pyk0VEKtGuzN1b_Ac3kMN5e8o9v3dOXRIpDK-6R_oEYvu4gl2OWOKQ4upijbjKQOVF6hC3A-Ko",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1807339217,
            "name": "__Secure-1PSIDTS",
            "value": "sidts-CjIBWhotCXEmZ4bTD9Zq0PQk0bxG9oz8HwhBw0JCUkFylTJ_BvnpcfNPpYg-GIt4WwMJFhAA",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1807339217,
            "name": "__Secure-3PSIDTS",
            "value": "sidts-CjIBWhotCXEmZ4bTD9Zq0PQk0bxG9oz8HwhBw0JCUkFylTJ_BvnpcfNPpYg-GIt4WwMJFhAA",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": false,
            "expires": 1807339218,
            "name": "SIDCC",
            "value": "AKEyXzX26WBZ7RDm5vvtwHNMoJHguiIaO0-ib0pny05E7pbmpbQVWApFvSVPvTLuVMgnMujtQkw",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1807339218,
            "name": "__Secure-1PSIDCC",
            "value": "AKEyXzWzEGAp-I4vTtYazge6Ok-RKCNHriWVBgFACi4a6LC6azyDS_g8623Qd7oyYG4xAi-oAUM",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1807339218,
            "name": "__Secure-3PSIDCC",
            "value": "AKEyXzUoTmGAbtqZgH9aeOR1SBJAJvCGMkuqCwExfCKJaEyEy8ZzA80bHoImB1BJrItHZFlIs38",
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