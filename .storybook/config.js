import { configure, addDecorator } from "@storybook/react";

const req = require.context('../stories', true, /\.stories\.jsx?$/);
const reqApp = require.context("../app", true, /\.stories\.jsx?$/);
const reqSrc = require.context("../src", true, /\.stories\.jsx?$/);


function loadStories() {
    for (let fileName of req.keys()) {
        req(fileName);
    }

    for (let fileName of reqApp.keys()) {
        reqApp(fileName);
    }

    for (let fileName of reqSrc.keys()) {
        reqSrc(fileName);
    }
}

configure(loadStories, module);
