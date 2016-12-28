// lib
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var nodeID3 = require('node-id3');
var removeDiacritics = require('diacritics').remove;
var pinyin = require("pinyin");

// config
var config = require('./config');
var BASE_PATH = "/home/syle/syle-host/Music";
var ARTISTS_MAP = config.ARTISTS;
var BLACK_LIST = config.BLACK_LIST;

function getFiles(initPath){
  var s = [];
  s.push(initPath);

  var result = [];

  while(s.length > 0){
    try{
      // use iterative approach
      var cur_path = s.pop();
      var items = fs.readdirSync(cur_path);
      items.forEach(function(item){
        var fullItemPath = path.join(cur_path, item);

        if(fs.lstatSync(fullItemPath).isDirectory()){
          s.push(fullItemPath);
        } else if(isMusicFile(fullItemPath)){
          result.push(fullItemPath);
        }
      });
    } catch(e){
      break;
    }
  }

  return result;
}

var SUPPORTED_EXTENSION = ['.mp3', '.aac', '.wav'];
function isMusicFile(fullItemPath){
  var isSupported = false;

  if(fullItemPath){
    fullItemPath = fullItemPath.toLowerCase();

    SUPPORTED_EXTENSION.forEach(function (curSupportedExtension) {
      if(fullItemPath.indexOf(curSupportedExtension) !== -1){
        isSupported = true;
      }
    });
  }

  return isSupported;
}


function getParsedTags(musicBaseFileName){
  if(musicBaseFileName.toString().match(/[\u3400-\u9FBF]/)){
    // is chinese
    musicBaseFileName = _.flattenDeep( pinyin(musicBaseFileName) ).join(' ');
  }

  musicBaseFileName = removeDiacritics(musicBaseFileName).toLowerCase();


  var title = musicBaseFileName;
  var artist = [];

  // artist map
  ARTISTS_MAP.forEach(function(artistNiceName){
    if(musicBaseFileName.indexOf(artistNiceName) >= 0){
      title = musicBaseFileName.replace(artistNiceName, '');
      artist.push(artistNiceName);
    }
  });

  // remove the black list...
  BLACK_LIST.forEach(function(blackItem){
    title = title.replace(blackItem, '');
  });

  return {
    title: _.startCase(title.trim()),
    artist: _.startCase(artist.join(' & ').trim())
  }
}


//run...
var allMusicFiles = getFiles(BASE_PATH);

console.log('Music Files Found', allMusicFiles.length);

allMusicFiles.forEach(function(musicFile){
  try{
    var musicBaseFileName = path.basename(musicFile, '.mp3');
    var tags = getParsedTags(musicBaseFileName);
    nodeID3.write(tags, musicFile);
  } catch(e){
    console.log(e);
  }
});
