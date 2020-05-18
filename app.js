const { http } = require("follow-redirects");
const axios = require('axios');
const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const PDFDocument = require("pdfkit");
const puppeteer = require("puppeteer");
const fs = require("fs");

dotenv.config();
app.use(express.json());
app.use(cors());

app.post("/test", async (request, response) => {
    response.header('Access-Control-Allow-Origin', '*');

    const { url, email, telefone } = request.body;

    console.log(url);
    console.log(email);
    console.log(telefone);

    const dominio = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split("/")[0]
    const gtmetrix = require("gtmetrix")({
        email: process.env.DF_EMAIL,
        apikey: process.env.DF_API_KEY,
        timeout: 5000
    });
    //
    try {
        const urlApi = process.env.DF_IMG_API + dominio
        const img = (await axios({ url: urlApi,method: 'GET' })).data.lighthouseResult.audits["final-screenshot"].details.data
        //
        http.get("http://" + dominio, async res => {
            const protocol = res.req._redirectable._options.protocol;
            const hostname = res.req._redirectable._options.hostname;
            const currentUrl = res.req._redirectable._currentUrl;
            const isRedirect = res.req._redirectable._isRedirect;
            const gtCreateResponse = await gtmetrix.test.create({url: hostname, location: 6, browser: 3})
            const gtDetails = await gtmetrix.test.get(gtCreateResponse.test_id, 2000)
            const gtResource = await gtmetrix.test.get(gtCreateResponse.test_id, process.env.DF_RESOURCE, 2000)
            //
            if(protocol == "http:") {
                return response.json({
                    message: "O dominio " + dominio + " não possui certificado SSL/TLS",
                    protocol: "http",
                    currentUrl: currentUrl,
                    hostname: hostname,
                    img: img,
                    gtCreateResponse: gtCreateResponse,
                    gtDetails: gtDetails,
                    gtResource: gtResource
                }); 
            }
            //
            return response.json({ 
                protocol, 
                hostname, 
                currentUrl,
                img,
                isRedirect, 
                gtCreateResponse, 
                gtDetails, 
                gtResource 
            });
        //
        }).on("error", (error) => {
            return response.json({
                error: error,
                message: "O dominio " + dominio + " não possui certificado SSL/TLS",
                protocol: "http"
            });
        });
        //
    } catch (error) {
        console.log(error);
    }
    
});

app.get("/create-pdf", (request, response) => {

const createPDF = async () => {

    // The location / URL
    const url = "http://aqicn.org/city/beijing/";

    // Create the browser
    const browser = await puppeteer.launch({
        headless: true
    });

    // Navigate to the website
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "load" });

    // Modified colors
    // await page.emulateMedia("screen");

    // const pdfBuffer = await page.pdf();
    // fs.writeFileSync("page.pdf", pdfBuffer);

    // Generate the PDF
    const pdf = await page.pdf({ path: "page.pdf" });

    // The width, height, and margin options accept values labeled with units. Unlabeled values are treated as pixels.

    // width: "100px"
    // px - pixel
    // in - inch
    // cm - centimeter
    // mm - millimeter

    // height: "100px"
    // px - pixel
    // in - inch
    // cm - centimeter
    // mm - millimeter

    // format: "A0"
    // Letter: 8.5in x 11in
    // Legal: 8.5in x 14in
    // Tabloid: 11in x 17in
    // Ledger: 17in x 11in
    // A0: 33.1in x 46.8in
    // A1: 23.4in x 33.1in
    // A2: 16.54in x 23.4in
    // A3: 11.7in x 16.54in
    // A4: 8.27in x 11.7in
    // A5: 5.83in x 8.27in
    // A6: 4.13in x 5.83in

    // Close the browser
    await browser.close();
    console.log(pdf)

response.send(pdf)


};
})

//TESTE DO SERVIDOR
app.get("/hello", (request, response) => {
    response.json({ message: 'Hello Test' })
})
//
app.listen(process.env.PORT || 3000, () => {
    console.log("Servidor iniciado!");
});
