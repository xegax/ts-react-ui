var fs = require('fs');
var path = require('path');
var process = require('process');
var cp = require('child_process');

// var args = process.argv.slice(2);

function rmrf(dirpath, dirToSkip) {
  dirToSkip = dirToSkip || [];

  var dirToRemove = [];
  if (!dirToSkip.length) {
    dirToRemove = [dirpath];
  } else {
    dirToRemove = fs.readdirSync(dirpath).filter(p => {
      dirToSkip.indexOf(path.resolve(dirpath + '/' + p)) == -1;
    }).map(p =>  path.resolve(dirpath + '/' + p));
  }

  dirToRemove.forEach(dir => {
    cp.exec('rimraf ' + dir + '/*');
    cp.exec('rimraf ' + dir);
  });
}

const srcDirs = fs.readdirSync('src').filter(f => fs.statSync('src/' + f).isDirectory());
srcDirs.forEach(dir => rmrf(dir));