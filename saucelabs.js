/*jslint indent:2, maxlen:80, node:true*/
'use strict';

// exports

module.exports = {
  urls: [
    'http://localhost:9999/tests/browser/bare-answerSpace/index.html'
  ],
  tunnelTimeout: 5,
  build: process.env.TRAVIS_JOB_ID,
  concurrency: 3,
  browsers: [
    {
      browserName: "internet explorer",
      version: "11",
      platform: "Windows 8.1"
    },
    {
      browserName: "internet explorer",
      version: "10",
      platform: "Windows 8"
    },
    {
      browserName: "firefox",
      version: "26",
      platform: "Windows 7"
    },
    {
      browserName: "googlechrome",
      version: "31",
      platform: "OS X 10.9"
    },
    {
      browserName: "android",
      version: "4.0",
      platform: "Linux",
      "device-orientation": "portrait"
    },
    {
      browserName: "iphone",
      version: "7",
      platform: "OS X 10.9",
      "device-orientation": "portrait"
    },
    {
      browserName: "iphone",
      version: "6.1",
      platform: "OS X 10.8",
      "device-orientation": "portrait"
    }
  ],
  testname: 'bic-v2',
  tags: ['master']
};
