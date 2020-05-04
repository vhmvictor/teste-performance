const { https } = require("follow-redirects");
const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
app.use(express.json());
app.use(cors());

app.get("/hello", (request, response) => {
    response.json({ message: 'Hello Heroku' })
})

app.post("/test", async (request, response) => {

    const { url } = request.body;

    console.log(url)

    const dominio = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split("/")[0]

    const gtmetrix = require("gtmetrix")({
        email: process.env.DF_EMAIL,
        apikey: process.env.DF_API_KEY,
        timeout: 1000
    });

    try {

        https.get("https://" + dominio, async res => {

            const protocol = res.req._redirectable._options.protocol;
            const hostname = res.req._redirectable._options.hostname;
            const currentUrl = res.req._redirectable._currentUrl;
            const isRedirect = res.req._redirectable._isRedirect;

            const gtCreateResponse = await gtmetrix.test.create({url: hostname, location: 6, browser: 3})
                const gtDetails = await gtmetrix.test.get(gtCreateResponse.test_id, 1000)
                    const gtResource = await gtmetrix.test.get(gtCreateResponse.test_id, process.env.DF_RESOURCE, 500)

            if(protocol == "http:") {
                return response.json({
                    message: "O dominio " + dominio + " não possui certificado SSL/TLS",
                    protocol: "http",
                    gtCreateResponse: gtCreateResponse,
                    gtDetails: gtDetails,
                    gtResource: gtResource
                }); 
            }

            return response.json({ 
                protocol, 
                hostname, 
                currentUrl, 
                isRedirect, 
                gtCreateResponse, 
                gtDetails, 
                gtResource 
            });

        }).on("error", () => {

            return response.json({
                message: "O dominio " + dominio + " não possui certificado SSL/TLS",
                protocol: "http"
            });
        });

    } catch (error) {
        console.log(error);
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Servidor iniciado na porta 3000: http://localhost:3000/");
});