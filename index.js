const chrome = require('selenium-webdriver/chrome');
const { Builder, By, until, Key } = require('selenium-webdriver');
const robot = require('@jitsi/robotjs');
require('dotenv').config();
const data = require('./data.json');
const { exec } = require('child_process');

let driver;
function bringChromeToFront() {
    return new Promise((resolve, reject) => {
        exec(`osascript -e 'tell application "Google Chrome" to activate'`, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}
async function loginToInstagram(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD) {
    let options = new chrome.Options();
    options.addArguments('--start-maximized');
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    await driver.get('https://www.instagram.com/accounts/login/');
    await driver.sleep(5000);

    await driver.wait(until.elementLocated(By.name('username')), 10000);
    await driver.findElement(By.name('username')).sendKeys(INSTAGRAM_USERNAME);
    await driver.findElement(By.name('password')).sendKeys(INSTAGRAM_PASSWORD);

    const loginButton = await driver.findElement(By.xpath("//button[@type='submit']"));
    await loginButton.click();

    await driver.wait(until.urlContains('instagram.com'), 10000);
    await driver.sleep(10000);
}

async function uploadToInstagram(POST_PATH, description) {
    const createButton = await driver.wait(until.elementLocated(By.xpath("//span[contains(text(), 'Create')]")), 10000);
    await createButton.click();

    const postButton = await driver.wait(until.elementLocated(By.xpath("//span[contains(text(), 'Post')]")), 10000);
    await postButton.click();

    const uploadButton = await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'Select From Computer')]")), 10000);
    await uploadButton.click();

    const fileInput = await driver.findElement(By.css("input[accept*='video']"));
    await fileInput.sendKeys(POST_PATH);

    await bringChromeToFront(); 
    await driver.sleep(1000);        
    robot.keyTap('escape'); 
    
    try {
        const okayButton = await driver.wait(until.elementLocated(By.xpath("//div[@role='dialog']//button[contains(text(), 'OK')]")),5000);
        await okayButton.click();
    } catch (e) {
    }

    const next1 = await driver.wait(until.elementLocated(By.xpath("//div[@role='button' and contains(., 'Next')]")), 10000);
    await next1.click();
    await driver.sleep(2000);

    const next2 = await driver.wait(until.elementLocated(By.xpath("//div[@role='button' and contains(., 'Next')]")), 10000);
    await next2.click();
    await driver.sleep(2000);

    const captionTextArea = await driver.wait(until.elementLocated(By.css("[aria-label='Write a caption...']")), 10000);
    await captionTextArea.sendKeys(description);

    await driver.actions().sendKeys(Key.TAB).perform();

    const share = await driver.wait(until.elementLocated(By.xpath("//div[@role='dialog']//div[@role='button' and text()='Share']")), 10000);
    await driver.executeScript("arguments[0].click();", share);

    await driver.sleep(5000);
}

(async function runAll() {
    for (let user of data.users) {
        let name = user.name;
        let instaId = process.env[`${name}_INSTAGRAM_USERNAME`];
        let instaPassword = process.env[`${name}_INSTAGRAM_PASSWORD`];

        await loginToInstagram(instaId, instaPassword);

        for (let upload of user.uploads) {
            let path = upload.path;
            let description = upload.description;

            await driver.executeScript("window.open('https://www.instagram.com', '_blank');");
            await driver.sleep(4000);

            let tabs = await driver.getAllWindowHandles();
            await driver.switchTo().window(tabs[tabs.length - 1]);

            await uploadToInstagram(path, description);
        }
    }
})();