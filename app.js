const { http } = require("follow-redirects");
const axios = require('axios');
const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const PDFDocument = require("pdfkit");

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
    const doc = new PDFDocument({});

    const filename = "Victor Hugo";
    //não baixar dpf, gerar nova aba no navegador
    response.setHeader("Content-disposition", 'inline: filename="' + filename + ".pdf" + '"');

    response.setHeader("Content-type", "application/pdf");

    doc.pipe(response);
    doc.end();
    response.json({ message: 'Deu certo' })
})

//TESTE DO SERVIDOR
app.get("/hello", (request, response) => {
    response.json({ message: 'Hello Test' })
})
//
app.listen(process.env.PORT || 3000, () => {
    console.log("Servidor iniciado!");
});
