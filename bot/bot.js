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
            "value": "530=RmgXsrXzIzzU_d5lvN0ToRbSvUnBmYfzfJ8qiKW7anDUF5z8_DOt5GZSVmHybTStQrFn8OuaryVLHfSRfzpJMSncFXEk6TMhiu61h7ZvHjlt-duzV_gdpRPRfnosFzT3yzN1IeAa0AT6KZWpl559KL1VoaO-0MxD_N9okJixXC1BL2MgiN3QIhsihvOPpVrYxzcnq6gaKKFBrbiakvMdQbph62vXkX8pP8lctop-BekJ453ZZ7QGW5DbmXQV6-ICP4N0J6ktaF4Dh4Mq284OqXNzF1lalgB6Y5Y_f9YD3A1BFbdJXaRKOrSmInVB4HZZXav35CX4Ym7Tl8rvWeTpjn9fTT7B0Gx66Amseuw_LvVlsPEfpKFpbEbafYX7ho5i1ISK2KMDYQmSM_PnYtvtDGUzKYD4FjefEcjlgMEjbyLKRVji4eE-MT4Cj2ztzzn0OPXeUzT5OCUqNfnA0a6GLZ_xFjxWwlUjASbmK2utBxR0WWEphRBx8YLdIsA7fNsBVo90C7adLo3-Cygr0kABtzDlxyXPs5m88Ju6Jg6cVwFz0YXvrpOrFfb-40_TU-GVWmWjQZuFtQkMD-A-df8lLICmDxn1Y8qdnIMV_yqCTOLbi3k5M8l-jW0TrKm8EQWHZeDQKcyioXNKtJO0lxxmvKcs9Rg53k1msx4FtoW3tvj2Hpjv9GLEn70xlhFrpEEQqZOtOZN4FH3wthA6Y8kN0kN8lju1QBXW4hyqoC8yGUW92x5W9xnwxDTxWUPFAKaXk32P4wXS0NEDlD74he88JzgfqBeDds_sr-HtAdvgJHceBzCdZMpF3ahx_uqHhAxW9Nf7HSw8XivfuhSscAM0IfyCYRbYqn_hH6zDMel_KBiA8HA69LK5GjnbC_KzmCFtrg-5vjg7ObUScRgm969SCZMAIsRUf5kpaM5L25sSlP0ONL8IjXCcvIY7JoOyEHaSYhCmA3xENvQbu-3oIv16si6_L4LURF307eCC2cwHO8Vq4fpXZAjHGaFYYmMy4IVJ0Z7bnymwzD0U6RJ3u_1dAGvmEPu32yS_JJxjUjkCsyvcI9O71PJYzJ1WTaSxwujsemYIG8ZGVp6JQl2_gfttNoa0K6skjg",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": "meet.google.com",
            "path": "/",
            "secure": true,
            "expires": 1810363874,
            "name": "OSID",
            "value": "g.a0008wh16GULm9a4qANMyuFW8Ixz5EIwmhRAqnGu9GpXPitXvG-PDLPc-oxp06GK8YRg4af2UgACgYKAeISARMSFQHGX2MiuJV3JV0gT43euUaV9tytvRoVAUF8yKp056FswdHXzVZovo_G8iQ30076",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": "meet.google.com",
            "path": "/",
            "secure": true,
            "expires": 1810363874,
            "name": "__Secure-OSID",
            "value": "g.a0008wh16GULm9a4qANMyuFW8Ixz5EIwmhRAqnGu9GpXPitXvG-PVvVRJTWXYRs2eXGoklK7mwACgYKAXASARMSFQHGX2Mi2VNLMNMtkPq4cYYotcvZtxoVAUF8yKrKcQJli2wE7uQMZFgGvxXB0076",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": false,
            "expires": 1810363874,
            "name": "SID",
            "value": "g.a0008wh16AZD69CnZy8QGMlmbYQehWmfPN1yCnIAZ6_iNxgEAw1YVjLaGzy0oSS1ilsUBiZyNQACgYKAasSARMSFQHGX2MiNHJg-xUHazwl7l06KAHxeRoVAUF8yKoYbWE2hBG9q_V5RVX0kKCT0076",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1810363874,
            "name": "__Secure-1PSID",
            "value": "g.a0008wh16AZD69CnZy8QGMlmbYQehWmfPN1yCnIAZ6_iNxgEAw1Y27VLwrSy0NaPCNC54a4e5QACgYKAQwSARMSFQHGX2Mil3GbpmYHg7EYkEAQoFsFORoVAUF8yKpdIHJ2gLXKBSIdB90q7U_D0076",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1810363874,
            "name": "__Secure-3PSID",
            "value": "g.a0008wh16AZD69CnZy8QGMlmbYQehWmfPN1yCnIAZ6_iNxgEAw1YPDmhZqe8h15FBCP84_yqiwACgYKAekSARMSFQHGX2Mif_Nj2OqDUXWYeL8XF3s-kBoVAUF8yKpSuAXzW9kj4TKIJNb-3qbf0076",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": false,
            "expires": 1810363874,
            "name": "HSID",
            "value": "ACVWoUiUYmYI2F1fJ",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1810363874,
            "name": "SSID",
            "value": "A5sZif7yANvz0cSFF",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": false,
            "expires": 1810363874,
            "name": "APISID",
            "value": "mLxeHfBDzHW6Qspr/ABtQiTO2IfVlE_NGQ",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1810363874,
            "name": "SAPISID",
            "value": "KbTess8cW3uytrbg/ASubcahtexMFmMFW1",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1810363874,
            "name": "__Secure-1PAPISID",
            "value": "KbTess8cW3uytrbg/ASubcahtexMFmMFW1",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1810363874,
            "name": "__Secure-3PAPISID",
            "value": "KbTess8cW3uytrbg/ASubcahtexMFmMFW1",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1807342863,
            "name": "__Secure-1PSIDTS",
            "value": "sidts-CjIBWhotCdXpy-qEnopEDoGHie-FpYdMTJ0x5Z2SjGzw12FKUhAJfNcNeaKCHHS01aPpfhAA",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1807342863,
            "name": "__Secure-3PSIDTS",
            "value": "sidts-CjIBWhotCdXpy-qEnopEDoGHie-FpYdMTJ0x5Z2SjGzw12FKUhAJfNcNeaKCHHS01aPpfhAA",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": false,
            "expires": 1807342866,
            "name": "SIDCC",
            "value": "AKEyXzUpLWe45-M8wMA6PK0sOYPFoPI4cf1oYFaSLEKRCUeg8YGc4B2ZI6VCw001syynAmckYAk",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1807342866,
            "name": "__Secure-1PSIDCC",
            "value": "AKEyXzWaX2eHav86szOUOGbz45D_4doczMAhyuC1DVLGxC9VXkhLX2wVgsNO0fCBetr2vhvZGRQ",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1807342866,
            "name": "__Secure-3PSIDCC",
            "value": "AKEyXzUDajDj-jsd9BN6anYOxR4xFTHnYjOzoFaxn8vB75dl1GEdqG7xqLI_z3b4-9FGuQLqm0w",
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