import Nightmare from 'nightmare';
import puppeteer from 'puppeteer';
import { BrowserRunner } from './browserRunner';
import MatmanResult from '../model/MatmanResult';
import MatmanConfig from '../config/MatmanConfig';
import CookieConfig, { CookieConfigOpts } from '../config/CookieConfig';
import DeviceConfig, { DeviceConfigOpts } from '../config/DeviceConfig';
import ScreenshotConfig, { ScreenOpts } from '../config/ScreenshotConfig';
import CoverageConfig, { CoverageOpts } from '../config/CoverageConfig';
import MatmanResultConfig, { ResultOpts } from '../config/MatmanResultConfig';
import MockstarConfig, { MockstarQueryDataMap } from '../config/MockstarConfig';

/**
 * PageDriver 需要实现的接口
 * 因为需要在 Master 中依赖, 为了避免循环依赖, 所以将其定义为接口, 提升到 core 包
 *
 * @member matmanConfig matman 配置
 * @member caseModuleFilePath 测试案例路径
 * @member useRecorder 是否启用记录器
 * @member tag 标记, 主要控制生成多组结果
 * @member delayBeforeRun 在运行前是否推迟执行
 * @member proxyServer 代理
 * @member mockstarQuery mockstar 查询函数
 * @member cookies 需要设置的 cookies
 * @member deviceConfig 设备配置信息
 * @member screenshotConfig 屏幕截图配置信息
 * @member coverageConfig 覆盖率配置信息
 * @member matmanResultConfig 结果配置信息
 * @member pageUrl 页面 URL
 * @member evaluateFn 需要执行的爬虫脚本, 可以为函数或者打包好的文件
 * @member evaluateFnArgs
 * @member actionList 存放 action 的数组
 * @member dataIndexMap 描述与索引的映射, 用户一般不用操作
 *
 * @author wangjq4214
 */
export interface PageDriver {
  // 配置类
  matmanConfig: MatmanConfig;
  caseModuleFilePath: string;
  show: boolean;
  doNotCloseBrowser: boolean;
  useRecorder: boolean;
  tag: string | undefined;
  delayBeforeRun: number;
  executablePath: string | undefined;
  proxyServer: string;

  mockstarConfig: null | MockstarConfig;
  cookieConfig: null | CookieConfig;
  deviceConfig: null | DeviceConfig;
  screenshotConfig: null | ScreenshotConfig;
  coverageConfig: null | CoverageConfig;
  matmanResultConfig: null | MatmanResultConfig;

  // page 信息
  pageUrl: string;
  evaluateFn: null | (() => any) | string;
  evaluateFnArgs: any[];
  actionList: ((n: Nightmare & puppeteer.Page) => Nightmare | Promise<void>)[];
  dataIndexMap: { [key: string]: number };

  getRunner(): BrowserRunner;

  /**
   * 走指定的代理服务，由代理服务配置请求加载本地项目，从而达到同源测试的目的
   * 若不配置，则之前请求现网，亦可直接测试现网的服务
   *
   * https://github.com/segmentio/nightmare#switches
   *
   * @param {String} proxyServer 代理服务器，格式为 my_proxy_server.example.com:8080，例如 127.0.0.1:8899
   * @return {PageDriver}
   * @author helinjiang
   */
  useProxyServer(proxyServer: string): PageDriver | Promise<void>;

  /**
   * 使用 mockstar 工具来做接口 mock 数据
   *
   * https://github.com/mockstarjs/mockstar
   *
   * @return {PageDriver}
   * @author helinjiang
   */
  useMockstar(queryMap: MockstarQueryDataMap): PageDriver | Promise<void>;

  /**
   * 更新 mockstar 中的请求
   *
   * https://github.com/mockstarjs/mockstar
   *
   * @return {PageDriver}
   * @author helinjiang
   */
  changeMockstar(queryMap: MockstarQueryDataMap): PageDriver | Promise<void>;

  /**
   * 注入 cookie
   *
   * https://github.com/helinjiang/nightmare-handler/blob/master/docs/exCookies.md
   * https://github.com/helinjiang/nightmare-handler/tree/master/demo/extend-exCookies
   *
   * @param {String | Object } cookieConfig 支持 `mykey1=myvalue1; mykey2=myvalue2` 和 `{mykey1:'myvalue1', mykey2:'myvalue'}` 写法
   * @return {PageDriver}
   * @author helinjiang
   */
  setCookieConfig(cookieConfig: CookieConfigOpts): PageDriver | Promise<void>;

  /**
   * 设置无头浏览器设备参数
   *
   * https://github.com/helinjiang/nightmare-handler/blob/master/docs/exDevice.md
   *
   * @param {String | Object} deviceConfig 设备名或者设备配置，默认值为 mobile
   * @param {String} [deviceConfig.name] 设备名字
   * @param {String} [deviceConfig.UA] userAgent
   * @param {Number} [deviceConfig.width] 视窗宽度
   * @param {Number} [deviceConfig.height] 视窗高度，注意这里不是指页面的高度，页面高度要小于这个值
   * @return {PageDriver}
   * @author helinjiang
   */
  setDeviceConfig(deviceConfig: DeviceConfigOpts): PageDriver | Promise<void>;

  /**
   * 设置截屏参数，默认不截图
   *
   * @param {Boolean | String | Object} screenshotConfig
   * @return {PageDriver}
   * @author helinjiang
   */
  setScreenshotConfig(screenshotConfig: ScreenOpts): PageDriver | Promise<void>;

  /**
   * 设置覆盖率参数
   *
   * @param {Boolean | String | Object} coverageConfig
   * @return {PageDriver}
   * @author helinjiang
   */
  setCoverageConfig(coverageConfig: CoverageOpts): PageDriver | Promise<void>;

  /**
   * 设置 MatmanResult 执行结果参数
   *
   * @param {Boolean | String | Object} matmanResultConfig
   * @return {PageDriver}
   * @author helinjiang
   */
  setMatmanResultConfig(matmanResultConfig: ResultOpts): PageDriver | Promise<void>;

  /**
   * 加载指定的页面地址
   *
   * @param pageUrl
   * @return {PageDriver}
   * @author helinjiang
   */
  setPageUrl(pageUrl: string): PageDriver | Promise<void>;

  /**
   * 增加测试动作
   *
   * @param {String} actionName 动作名称，后续可通过它来获得最后的数据
   * @param {Function} actionCall 执行函数，接受一个 nightmare 对象，可以直接操作
   * @return {PageDriver}
   * @author helinjiang
   */
  addAction(
    actionName: string,
    actionCall: (n: Nightmare & puppeteer.Page) => Nightmare | Promise<void>,
  ): PageDriver | Promise<void>;

  /**
   * 执行爬虫脚本或者方法获得结果
   *
   * https://www.npmjs.com/package/nightmare#evaluatefn-arg1-arg2
   *
   * @param {String | Function} fn
   * @param [args]
   * @return {Promise<MatmanResult|PageDriver>}
   * @author helinjiang
   */
  evaluate(fn: string): Promise<MatmanResult | PageDriver>;
  evaluate(fn: () => any, ...args: any[]): Promise<MatmanResult | PageDriver>;
}
