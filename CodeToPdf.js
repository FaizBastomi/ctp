// Dependencies and stuffs
const nhentai = require("nhentai-js");
const fs = require("fs");
const axios = require("axios").default;
const imgToPDF = require("image-to-pdf");
const { join } = require("path");
const rl = require("readline");
const rq = rl.createInterface(process.stdin, process.stdout)

// Colors
let red = "\x1b[31m"
let blue = "\x1b[34m"
let Reset = "\x1b[0m"
let green = "\x1b[32m"

function start () {
    console.clear()
    console.log("'exit' to stop")
    rq.question("Your code: ", async (q) => {
        if (q === "exit") {
            process.exit();
        }
        try {
            await getDoujin(q);
        } catch(e) {
            console.log(red+"Something bad happend, try looking on log.txt"+Reset);
            fs.writeFileSync("log.txt", String(e.stack));
            await sleep(5000);
            start();
        } finally {
            console.log("Returning in 5 seconds");
            await sleep(5000);
            start();
        }
    })
}

start();

async function getDoujin(id) {

    const PDFpages = []; // name of pages will be stored here
    const directory = "temp_images" // directory where all image stored
    let pages_arr = [];

    try {
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory);
            console.log("Created New Directory To Store Images");
        } else {
            console.log("Directory already exists");
        }

        if (nhentai.exists(id)) { // Checks if Doujin exists

            const doujin = await nhentai.getDoujin(id);
            pages_arr = doujin.pages;
            let title = doujin.title;
            let download_count = 0;

            console.log(`${green}Doujin title: ${red}${title}${Reset}`);
            console.log(`${green}Downloading...${Reset}`);
            // Download images
            for (let i = 0; i < pages_arr.length; i++) {
                let img_name = directory + "/" + i + ".jpg";
                await download(pages_arr[i], img_name);
                PDFpages.push(img_name);
                download_count++;
                console.log(`${green}Downloading: ${download_count} - ${pages_arr.length}${Reset}`);
            }

            // Convert images to PDF
            await imgToPDF(PDFpages, 'A4').pipe(fs.createWriteStream(title + ".pdf"));

            // Delete stored images
            try {
                const files = fs.readdirSync(directory);
                for (const file of files) {
                    await fs.promises.unlink(join(directory, file))
                }
            } catch(e) {
                throw e;
            }
        } else {
            throw "Nuke code doesn't exists";
        }
    } catch(e) {
        throw e;
    } finally {
        console.log("Completed")
    }
}

async function download(url, path) {
    const data = await axios.get(url, {
        responseType: "arraybuffer"
    });
    await fs.promises.writeFile(path, data.data);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}