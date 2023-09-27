const urlParams = new URLSearchParams(window.location.search);

const sdUrl = urlParams.get('sdurl');

if (!sdUrl) {
    console.log(sdUrl);
    alert(`No stable diffusion url provided. Please provide one by setting the 'sdurl' url parameter. e.g ${window.location.href}?sdurl=http:localhost:7860`);
}

const windowUrl = window.location.href.split('?')[0];

const select = (query) => document.querySelector(query);

const imageResultTemplate = select('#image-result-template');
const imageList = select('#results-list');

const promptInput = select('#prompt-input');
const negPromptInput = select('#negprompt-input');
const widthInput = select('#width-input');
const heightInput = select('#height-input');
const samplerInput = select('#sampler-input');
const cfgInput = select('#cfg-input');

const defaultSteps = select('#default-steps-input').value;
const enhancedSteps = select('#enhanced-steps-input').value;

const collapsableSettings = select('#collapsable-settings');
const collapseMenuBtnImg = select('#collapse-menu-button img');

const settingsLabels = document.querySelectorAll('#collapsable-settings label');

settingsLabels.forEach((label) => {
    label.addEventListener('click', () => {
        const attachedInput = document.querySelector(`#${label.getAttribute('for')}`);
        const imageIcon = label.querySelector('img');

        if (attachedInput.style.display === "none") {
            attachedInput.style.display = ""; //Clear JS set styling
            imageIcon.src = `${windowUrl}/img/collapse.svg`;
        } else {
            attachedInput.style.display = "none";
            imageIcon.src = `${windowUrl}/img/expand.svg`;
        }
    });
});

function toggleSettings() {
    if (collapsableSettings.style.display === "none") {

        collapsableSettings.style.display = "flex";
        collapseMenuBtnImg.src = `${windowUrl}/img/collapse.svg`;

    } else {

        collapsableSettings.style.display = "none";
        collapseMenuBtnImg.src = `${windowUrl}/img/expand.svg`;

    }
}

async function loadNewImage() {
    const clone = imageResultTemplate.content.cloneNode(true).querySelector('.result-image-container');
    const enhanceBtn = clone.querySelector('.enhance-button');
    const downloadBtn = clone.querySelector('.download-button');

    const width = widthInput.value;
    const height = heightInput.value;

    enhanceBtn.setAttribute('disabled', true);
    downloadBtn.setAttribute('disabled', true);

    const resultImgElem = clone.querySelector('.result-image');

    resultImgElem.style['aspect-ratio'] = `${width} / ${height}`;

    imageList.appendChild(clone);

    const imageReq = await getImage(promptInput.value, negPromptInput.value, -1, defaultSteps, cfgInput.value, width, height, samplerInput.value);

    resultImgElem.src = imageReq.url;
    resultImgElem.dataset.params = JSON.stringify(imageReq.returned_info);

    enhanceBtn.removeAttribute('disabled');
    downloadBtn.removeAttribute('disabled');
}

//Buttons
async function enhanceImage(elem) {
    elem.setAttribute('disabled', true)

    const resultImageElem = elem.parentElement.querySelector('img.result-image');

    resultImageElem.classList.add('loading');

    const paramsString = resultImageElem.dataset.params;
    const params = JSON.parse(paramsString);
    
    const enhanced = await getImage(params.prompt, params.negative_prompt, params.seed, enhancedSteps, params.cfg_scale, params.width, params.height, params.sampler_name);

    resultImageElem.src = enhanced.url;
    resultImageElem.classList.remove('loading');
}

function downloadImage(elem) {
    const resultImageElem = elem.parentElement.querySelector('img.result-image');

    const downloadLink = document.createElement('a');
    downloadLink.href = resultImageElem.src;
    downloadLink.setAttribute('download', 'result.png');

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

//SD
async function getImage(prompt, negPrompt = "", seed = -1, steps = 20, cfgScale = 7, width = 512, height = 512, samplerIndex = "Euler a") {
    const body = {
        prompt: prompt,
        negative_prompt: negPrompt,
        seed: seed,
        steps: steps,
        cfg_scale: cfgScale,
        width: width,
        height: height,
        sampler_index: samplerIndex,
        send_images: true,
        save_images: true
    };

    const response = await fetch(`${sdUrl}/sdapi/v1/txt2img`, {
        method: "POST",
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    });

    const json = await response.json();

    const returnedInfo = JSON.parse(json.info);
    const resultImage = json.images[0];

    const b64Res = await fetch(`data:image/png;base64,${resultImage}`).then(res => res.blob());
    const blobUrl = URL.createObjectURL(b64Res);

    return {url: blobUrl, returned_info: returnedInfo};
}