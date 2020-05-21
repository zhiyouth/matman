import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';
import glob from 'glob';

import { getWebpackConfig, runBuild } from './builder-webpack4';

/**
 * 构建
 *
 * @param {MatmanConfig} matmanConfig
 * @return {Promise}
 */
export default function build(matmanConfig) {
    return new Promise((resolve, reject) => {
        // 获得 webpack 构建选项
        getWebpackConfig(matmanConfig)
            .then((webpackConfig) => {

                if (matmanConfig.isDevBuild) {
                    // 获取到 webpack 配置项结果
                    console.log('webpackConfig: \n', webpackConfig);
                }

                // 执行构建
                runBuild(webpackConfig, () => {
                    // 构建完成之后保存一份配置到构建目录中
                    saveWebpackConfig(matmanConfig.crawlerBuildPath, webpackConfig);

                    const prependCodePromiseList = [];
                    const evalList = [];

                    if (!matmanConfig.isDevBuild) {
                        // 如果是非开发模式下
                        // 为打包之后的文件手动增加 nightmare client script，以便能与 nightmare 通信
                        prependCodePromiseList.push(getNightmareClientCode());

                        // 插入 jQuery
                        if (matmanConfig.crawlerInjectJQuery) {
                            prependCodePromiseList.push(getJqueryCode('jQueryCode'));
                            evalList.push('jQueryCode');
                        }
                    } else {
                        // 如果是开发模式下
                        // 追加开发模式下需要的代码，例如 jQuery
                        prependCodePromiseList.push(getDevPrependCode(matmanConfig.crawlerInjectJQuery));
                    }

                    // 获得所有的代码之后，追加在头部
                    if (prependCodePromiseList.length) {
                        Promise.all(prependCodePromiseList)
                            .then((result) => {
                                result.push(`window.evalList=[${evalList.map(item => `"${item}"`).join(',')}]`);

                                // 每段插入的代码之后，注意要加一个换行符号，否则在支持 source map 之后，可能会被其"注释"掉
                                prependCodeToDistFile(matmanConfig.crawlerBuildPath, result.join(';\n'))
                                    .then(() => {
                                        resolve();
                                    })
                                    .catch((err) => {
                                        reject(err);
                                    });
                            })
                            .catch((err) => {
                                reject(err);
                            });
                    } else {
                        resolve();
                    }
                });
            })
            .catch((err) => {
                reject(err);
            });
    });

};

function getNightmareClientCode() {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, '../../asserts/nightmare-preload.js'), 'utf8', (err, data) => {
            if (err) {
                return reject(err);
            }

            resolve(data);
        });
    });
}

function getDevPrependCode(crawlerInjectJQuery) {
    return new Promise((resolve, reject) => {
        const injectFile = crawlerInjectJQuery ? 'dev-prepend-with-jquery.js' : 'dev-prepend.js';

        fs.readFile(path.join(__dirname, `./builder-webpack4/libs/${injectFile}`), 'utf8', (err, data) => {
            if (err) {
                return reject(err);
            }

            resolve(data);
        });
    });
}

function getJqueryCode(key) {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, '../../asserts/jquery.slim.min.js'), 'utf8', (err, data) => {
            if (err) {
                return reject(err);
            }

            // 必须通过定义变量的方式插入，后续再执行
            resolve(getRawCodeToPrepend(key, data));
        });
    });
}

function prependCodeToDistFile(crawlerScriptBuildPath, code) {
    let globResult = glob.sync(path.resolve(crawlerScriptBuildPath, './**/**.js'));

    let promiseList = [];

    globResult.forEach((item) => {
        // console.log(item);
        promiseList.push(_prependCodeToOneFile(item, code));
    });

    return Promise.all(promiseList);
}

function getRawCodeToPrepend(key, source) {
    let rawCode = JSON.stringify(source)
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');

    return `window.${key}=${rawCode};`;
}

function saveWebpackConfig(basePath, data) {
    // 必须要保证这个目录存在，否则构建时可能报错
    fse.ensureDirSync(basePath);

    fse.writeJsonSync(path.join(basePath, './webpack-config.json'), data);
}

function _prependCodeToOneFile(filePath, code) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, fileContent) => {
            if (err) {
                console.error('read file err!', filePath, err);
                return reject('read file err! filePath=' + filePath);
            }

            fse.outputFile(filePath, code + '\n;' + fileContent, err => {
                if (err) {
                    console.error('prepend fail!', filePath, err);
                    reject('prepend err! filePath=' + filePath);
                } else {
                    resolve();
                }
            });
        });
    });
}