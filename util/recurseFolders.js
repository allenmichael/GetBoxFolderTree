'use strict';
const _ = require('lodash');
const autoPageWithOffset = require('./autoPage').autoPageWithOffset;

var fileCollection = [];
var folderCollection = [];
var folderCollectionIndex = [];
var nextFolder;

var folderPathIndex = {};

function recurseFolders(client, id, options, callback) {
  id = id || "0";
  autoPageWithOffset(client, "folders", "getItems", id, options, function (err, response) {
    if (err) {
      callback(err);
      return;
    }
    response.forEach(function (item) {
      if (item.type === "folder") {
        folderCollectionIndex.push(item);
        folderCollection.push(item);
      } else if (item.type === "file") {
        fileCollection.push(item);
      }
    });
    if (folderCollection.length > 1) {
      nextFolder = folderCollection.shift();
      recurseFolders(client, nextFolder.id, options, callback);
    } else {
      callback(null, { files: fileCollection, folders: folderCollectionIndex });
    }
  });

}

function findFolderFromFolderPath(obj, folderPath) {
  var path = folderPath.split('.');
  var folder;
  if (path.length === 1) {
    return obj;
  }
  if (path.length > 1) {
    path.shift();
    var findObject = obj.folders;
    path.forEach(function (val, index, arr) {
      var match = _.find(findObject, function (folder) {
        return folder.id == val;
      });
      if ((match && index == arr.length - 1) || (match && arr.length === 1)) {
        folder = match;
      } else {
        findObject = match.folders;
      }
    });
    return folder;
  }
}

function recurseFoldersForFolderTree(client, id, options, folderTree, folders, callback) {
  id = id || "0";
  var folders = folders || [];
  var currentFolderPath = folderPathIndex[id];
  var currentFolder = findFolderFromFolderPath(folderTree, currentFolderPath);
  autoPageWithOffset(client, "folders", "getItems", id, options, function (err, response) {
    if (err) {
      callback(err);
      return;
    }
    response.forEach(function (item) {
      if (item.type === "folder") {
        var itemFolderPath = `${currentFolderPath}.${item.id}`;
        folderPathIndex[item.id] = itemFolderPath;
        item.folder_path = itemFolderPath;
        item.folders = [];
        item.files = [];
        currentFolder.folders.push(item);
        folders.push(item.id);
      } else if (item.type === "file") {
        item.folder_path = currentFolderPath;
        currentFolder.files.push(item);
      }
    });
    if (folders.length > 0) {
      recurseFoldersForFolderTree(client, folders.shift(), options, folderTree, folders, callback);
    } else {
      return callback(null, folderTree);
    }
  });
}

function getFolderTree(client, id, options, callback) {
  id = id || "0";
  if (!options || !options.fields) {
    options = options || {};
    options.fields = "id,name";
  }
  client["folders"]["get"](id, options, function (err, response) {
    if (err) {
      callback(err);
      return;
    }
    var rootFolder = response;
    rootFolder.folders = [];
    rootFolder.files = [];
    rootFolder.folder_path = response.id
    folderPathIndex[id] = id;
    recurseFoldersForFolderTree(client, response.id, options, rootFolder, null, function (err, folderTree) {
      if (err) {
        callback(err);
        return;
      }
      callback(null, folderTree);
    })
  });
}

module.exports = {
  getAllFiles: recurseFolders,
  getFolderTree: getFolderTree
};