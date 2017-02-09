"use strict";
const express = require('express');
let router = express.Router();
const fs = require("fs");
const path = require("path");
const recurseFolders = require('../util/recurseFolders');
const Box = require('box-node-sdk');
let _ = require('underscore');

let BoxSdk = new Box({
  clientID: "",
  clientSecret: ""
});

router.get('/', function (req, res) {
  let accessToken = req.query.access_token;
  let parentId = req.query.folder_id || "0";
  let options = {};
  let fields = req.query.fields || "name,id";
  options.fields = fields;
  if (!accessToken) {
    res.status(400).send({ message: "access_token must be included as a query paramenter." });
  } else {
    let client = BoxSdk.getBasicClient(accessToken);
    recurseFolders.getFolderTree(client, parentId, options, function (err, folderTree) {
      if (err) {
        res.status(500).send({ message: "Something unexpected happened", error: err });
      }
      // let json = JSON.stringify(folderTree);
      // fs.writeFileSync(`${Date.now()}-${req.headers['x-forwarded-for'] || req.connection.remoteAddress}.json`, json);
      res.status(200).send(folderTree);
    });
  }
});

router.get('/foldertree', function (req, res) {
  res.render('index', { title: "Box Folder Tree Generator" });
});

router.get('/foldertreerender', function (req, res) {
  let accessToken = req.query.access_token;
  let parentId = req.query.folder_id || "0";
  let options = {};
  let fields = req.query.fields || "name,id";
  options.fields = fields;
  if (!accessToken) {
    res.status(400).send({ message: "access_token must be included as a query paramenter." });
  } else {
    let client = BoxSdk.getBasicClient(accessToken);
    recurseFolders.getFolderTree(client, parentId, options, function (err, folderTree) {
      if (err) {
        console.log(err);
        res.status(500).send({ message: "Something unexpected happened", error: err });
      }
      res.render('folderTree', {model: folderTree, title: "Box Folder Tree Generator" });
    });
  }
});

module.exports = router;
