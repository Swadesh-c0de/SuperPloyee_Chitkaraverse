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
            "secure": false,
            "expires": 1788894323,
            "name": "SEARCH_SAMESITE",
            "value": "CgQIrKAB",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1788894323,
            "name": "__Secure-BUCKET",
            "value": "CLYG",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1788894324,
            "name": "AEC",
            "value": "AaJma5vs5CATW1UC1SrV9BguWfgK9VdXpyBqF3iOTzmWnOrgesQ6DZ6FyA",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": "meet.google.com",
            "path": "/",
            "secure": true,
            "expires": 1778350953,
            "name": "OTZ",
            "value": "8557583_34_34__34_",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": false,
            "expires": 1810330896,
            "name": "SID",
            "value": "g.a0008wiUOlr9tH8IweUZYQvrdRAvEwp6Tyt8_Ty-UiHvVjo-GbQIh34_ZPNOoGVtxL9JoAY3FQACgYKAaQSARESFQHGX2MihZCfruUpbuswqkcYHzNXzBoVAUF8yKqmvVddPtKeLhf5TskPk13r0076",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1810330896,
            "name": "__Secure-1PSID",
            "value": "g.a0008wiUOlr9tH8IweUZYQvrdRAvEwp6Tyt8_Ty-UiHvVjo-GbQIk9lm3uRBLvnbpl_xDm74gAACgYKAT4SARESFQHGX2MiRmYZx9HLHvh2oEl4On2MjBoVAUF8yKriFk_kPgRYnzCJ8iN_6YFP0076",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1810330896,
            "name": "__Secure-3PSID",
            "value": "g.a0008wiUOlr9tH8IweUZYQvrdRAvEwp6Tyt8_Ty-UiHvVjo-GbQIXz6rAm2KJrpJd3jv0cwbpQACgYKAUwSARESFQHGX2MiRTxZlpaoNsExxS2C-djdJxoVAUF8yKp_yS5tb1Mnz673O7Ojj-J60076",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": false,
            "expires": 1810330896,
            "name": "HSID",
            "value": "AYEVExUUkYMNvCHeT",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1810330896,
            "name": "SSID",
            "value": "AJF5mFP0OMg17LaEe",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": false,
            "expires": 1810330896,
            "name": "APISID",
            "value": "cZRzgYC1TWlctl2R/AcZhu6_ZFs0uANe94",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1810330896,
            "name": "SAPISID",
            "value": "4EMbzheHMT1GEir7/AjD_akstTec4mA5Sj",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1810330896,
            "name": "__Secure-1PAPISID",
            "value": "4EMbzheHMT1GEir7/AjD_akstTec4mA5Sj",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1810330896,
            "name": "__Secure-3PAPISID",
            "value": "4EMbzheHMT1GEir7/AjD_akstTec4mA5Sj",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1791570132,
            "name": "NID",
            "value": "530=r9ocIDFS5gSqy-Mm3dxD1zO0y4VdKqAjrcbUgCVyGfwQi4h8mP2y_4HsL4Fp9_smjKpplzciO8yzWml6ce6j6sPLmk4NYFOgeeB30Tb8z64Kc7I-mQPSwdllVCAGc0dSvxb-PTx9eUcmO9tyS1Iew7LE4NbmZ5CAPYfBvo0AuHQV0sPxeW0wryLomr6Xzp2aIbWPMNqQPBtNLcO6JWonCfxlVa0n7tmCZNnx5RRHJuApdmiOufHGMtuHTCbvJhkjTuzPg2Y6CaWgNUC9O3W85MbytD90VM5zy85VYeAqf28c-iaWOjuJCkDn_o1NEzMpPYY29NkXOgXH7Dw3NYIvYKuLT1oSnrx02ekwTWFKNQWvu9W-GQQxgbtIQ0XV7D-Olj6oksNZWVOpVfhzz9RiDf5325qqqQ2bDE10sC7RONIPo5SSPtDIuHtALCidyKzaHSNT3VfNZZqMLhh1icEvaTr7nM8cMlaim9nS7vXu8SGxxPJWOfhnF59tFMLPeO3VdRgonZxS6Bj6ewZ5SGs6wVBeC_l6Yx3JEYvnZ-ykPd8GdIBHSjnL4OIiT6onbiW-o7QoYYVf1WxsaGMfs20GiIy_vyfzSlpDNHfC5sZUXR1DB6B-EZyYJo4VdW9EFO224rq2iHzcK4h-xQ4hzVPdLK0vdS0wD1VMvYkknV_F6kl7ViHPYAfbHb6AF2MiQGbw9Jn_N_9LZnQEGXw_yLmhju50snl8DYABKXMNXnYskK67iQDBrLTr4pLf6WVfJrMaCu9w",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1807332665,
            "name": "__Secure-1PSIDTS",
            "value": "sidts-CjEBWhotCUF3ibx12oHu3GXxHAwHaZz84K6JKLEIDPvu3C0pcK5xfpgUhJtjDBdEbmizEAA",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1807332665,
            "name": "__Secure-3PSIDTS",
            "value": "sidts-CjEBWhotCUF3ibx12oHu3GXxHAwHaZz84K6JKLEIDPvu3C0pcK5xfpgUhJtjDBdEbmizEAA",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": "meet.google.com",
            "path": "/",
            "secure": true,
            "expires": 1810356814,
            "name": "OSID",
            "value": "g.a0008wiUOjql7p6SQD1B9-jucfbA67g4-Uzywr9b4l7p5rxDZWyXwC9f7E4-7Ncm9pVuZ5YaYwACgYKAfkSARESFQHGX2Mi8aGXOEsbS7PzgJZ4SNZDJRoVAUF8yKqg7kZcCmblUqFD1yZbcIRt0076",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": "meet.google.com",
            "path": "/",
            "secure": true,
            "expires": 1810356814,
            "name": "__Secure-OSID",
            "value": "g.a0008wiUOjql7p6SQD1B9-jucfbA67g4-Uzywr9b4l7p5rxDZWyXq0zjItmqgVpiU7eAw4JAHgACgYKAXISARESFQHGX2MixGeBnL_naRvJFSwC0ogN-BoVAUF8yKqeveR-kAWP3CAaYjKcFdRG0076",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": "meet.google.com",
            "path": "/",
            "secure": true,
            "expires": 1776660814,
            "name": "COMPASS",
            "value": "meet-ui=CgAQponizgYaZgAJa4lXrtJ14PilhqKQblYKmig88DgPSJMM_jUSqpKkqOCBNKjmuqx5sGbBORsnu_FNMm7rfTIfKHpH7S1wb9gy0VG256UtQCQLakisTy0JYdK-lFrPumm9NWlxazPId2OUYpm0qDAB",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": false,
            "expires": 1807332819,
            "name": "SIDCC",
            "value": "AKEyXzVB7edRqcGc8qhPRACcyGGiMZ3fHcAj2E7_MXVbdwiJbClmKmFIHH9w3u0HQtEBZhiQAB0",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1807332819,
            "name": "__Secure-1PSIDCC",
            "value": "AKEyXzXD-8JXiOqZ5n0ApzP-Tb0VV3PNYuKPj7sy16k2RmWw7UDeceY_U_wibGDCKSQnugiUww",
            "sameSite": "Lax",
            "httpOnly": false
        },
        {
            "domain": ".google.com",
            "path": "/",
            "secure": true,
            "expires": 1807332819,
            "name": "__Secure-3PSIDCC",
            "value": "AKEyXzWOw73ABcsBtIWYPFGFKqmT8wPIUPsY-544ue81SsIdH7max1Fzwu8wumhNOg00MkGz9w",
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