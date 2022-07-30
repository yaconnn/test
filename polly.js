import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import {
    fromCognitoIdentityPool,
} from "@aws-sdk/credential-provider-cognito-identity";
import { Polly } from "@aws-sdk/client-polly";
import { getSynthesizeSpeechUrl } from "@aws-sdk/polly-request-presigner";

// Create the Polly service client, assigning your credentials
const client = new Polly({
    region: "us-east-1",
    credentials: fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region: "us-east-1" }),
        identityPoolId: "us-east-1:52cd130b-1a04-46b2-ac7b-44c3804b735e" // IDENTITY_POOL_ID
    }),
});

// Set the parameters
const speechParams = {
    Engine: "neural",
    OutputFormat: "mp3", // For example, 'mp3'
    SampleRate: "22050", // For example, '16000
    Text: "", // The 'speakText' function supplies this value
    TextType: "ssml", // For example, "text"
    VoiceId: "Matthew" // For example, "Matthew"
};
const speakText = async () => {
    // Update the Text parameter with the text entered by the user
    // speechParams.Text = document.getElementById("textEntry").value;
    speechParams.Text = `<prosody rate="160%">This is just a test for speed.</prosody>`;
    try{
        let url = await getSynthesizeSpeechUrl({
            client, params: speechParams
        });
        console.log(url);
        // Load the URL of the voice recording into the browser
        document.getElementById('audioSource').src = url;
        document.getElementById('audioPlayback').load();
        document.getElementById('result').innerHTML = "Speech ready to play.";
    } catch (err) {
        console.log("Error", err);
        document.getElementById('result').innerHTML = err;
    }
};
// Expose the function to the browser
window.speakText = speakText;