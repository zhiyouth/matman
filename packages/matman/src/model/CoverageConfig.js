import path from 'path';
import fse from 'fs-extra';

import { findCrawlerParser, getFolderNameFromPath } from '../util';

export default class CoverageConfig {
    /**
     * 构造函数
     *
     * @param {String} basePath 测试用例的脚本目录
     */
    constructor(basePath) {
        this.path = this._getPath(basePath);
    }

    getPathWithId(id) {
        return this.path.replace(/(.*)\.(.*)/, function (match, p1, p2) {
            return [p1, `${id}.${p2}`].join('_');
        });
    }

    _getPath(basePath) {
        // 根据配置内容获得 crawlerParser 的对象
        const crawlerParser = findCrawlerParser(basePath);

        // 有可能找不到
        if (!crawlerParser) {
            console.error('Can not find crawlerParser by basePath', basePath);
            return '';
        }

        // 相对路径
        let relativePath = path.relative(crawlerParser.testerPath, basePath);
        let arr = relativePath.split(path.sep);

        // 文件名
        const folderName = arr.pop();

        // 需要保存的文件夹路径
        const saveDir = path.join(crawlerParser.coveragePath, getFolderNameFromPath(arr.join(path.sep)));

        // 要保证这个目录存在，否则保存时会报错
        fse.ensureDirSync(saveDir);

        return path.join(saveDir, folderName + '.json');
    }
}
