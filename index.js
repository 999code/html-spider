import xCrawl from "x-crawl";
import fs from "fs";
import * as cheerio from "cheerio";
import xlsx from "node-xlsx";

import pinyin from "chinese-to-pinyin";
const keyTxt = process.argv[2];
const keyTxtNamePy = pinyin(keyTxt, {
  removeSpace: true,
  removeTone: true,
});
const dataSchedule = [];
const myXCrawl = xCrawl({ intervalTime: { max: 5000, min: 1000 } });

const targets = [
  // 懒盘搜索
  {
    url: "https://www.lzpanx.com/v1/search/disk",
    method: "POST",
    data: {
      page: 1,
      q: keyTxt,
      user: "",
      exact: false,
      format: [],
      share_time: "",
      size: 30,
      type: "",
    },
  },
  {
    url: "https://www.ujuso.com/v1/search/disk",
    method: "POST",
    data: {
      page: 1,
      q: keyTxt,
      user: "",
      exact: false,
      format: [],
      share_time: "",
      size: 30,
      type: "",
    },
  },
  {
    url: `https://yapan.io/api/search?keyword=${keyTxt}&page_num=2&page_size=30&client_version=1.1.0`,
    method: "GET",
  },
  // TODO:需解密sign
  {
    url: "https://panyq.com/api/search?sign=2d7288aff98821edc6dc39327df0a8e0689f149bb4d2e4de59f776aa051cd20b09c77a5135c85a42c1b3402abf0415434f85f1e38d9a909a157a9805f9c66fd44f65bfc9a8a427a834ca86a21604a9cfe77583642b8bfd035a1170bc2f7eea3c",
    method: "GET",
  },
  //
];

myXCrawl.crawlData({ targets }).then((res) => {
  dataSchedule[0] = res[0].data?.data?.data?.list.map((item) => [
    item.disk_name,
    item.link,
    item.files,
  ]);
  dataSchedule[1] = res[1].data?.data?.data?.list.map((item) => [
    item.disk_name,
    item.link,
    item.files,
  ]);
  dataSchedule[2] = res[2].data?.data?.data?.rows.map((item) => [
    item.file_name,
    item.url,
    "https://yapan.io",
  ]);
  dataSchedule[3] = res[3].data.data.data.hits.map((item) => [
    item.group,
    "https://panyq.com",
    item.desc,
  ]);
  // 处理
});

function getUbkzData(htmls) {
  const $ = cheerio.load(htmls);
  const ubkzList = $($("#threadlist").find(".pbw"));
  const ubkzListData = [];
  // ubkz格式化
  ubkzList.each(function (i, item) {
    const ubkzListTitle = $($(item).find("a"));
    const ubkzListTitleText = $(ubkzListTitle[0]).text();
    const ubkzListTitleHref = $(ubkzListTitle[0]).attr("href");
    const ubkzListContent = $($(item).find("p")[1]).text();
    ubkzListData.push([ubkzListTitleText, ubkzListTitleHref, ubkzListContent]);
  });
  return ubkzListData;
}

function getXbpData(htmls) {
  const xbpData = [];
  const $ = cheerio.load(htmls);

  const xbpList = $(".result-wrap").find(".resource-item");
  xbpList.each(function (i, item) {
    const xbpListTitle = $($(item).find("a"));
    const xbpListTitleText = $(xbpListTitle[0]).text();
    const xbpListTitleHref =
      "https://www.xuebapan.com/" + $(xbpListTitle[0]).attr("href");
    const xbpListContent = $($(item).find(".detail-wrap")[0]).text();

    xbpData.push([xbpListTitleText, xbpListTitleHref, xbpListContent]);
  });
  // resource-title
  return xbpData;
}

function getYpzyData(htmls) {
  const $ = cheerio.load(htmls);
  const ypzyList = $(".threadlist").find(".thread");
  const ypzyListData = [];
  // ubkz格式化
  ypzyList.each(function (i, item) {
    const ypzyListTitle = $($(item).find("a"));
    const ypzyListTitleText = $(ypzyListTitle[0]).text();
    const ypzyListTitleHref =
      "https://www.yunpanziyuan.xyz/" + $(ypzyListTitle[0]).attr("href");
    // const ypzyListContent = $($(item).find(".list-group-item-text")[0]).text();
    ypzyListData.push([ypzyListTitleText, ypzyListTitleHref, ""]);
  });
  return ypzyListData;
}

// "https://pan666.net/?q=%E6%B2%99%E9%9B%95%E5%8A%A8%E7%94%BB",
function getPan666Data(htmls) {
  const $ = cheerio.load(htmls);
  const pan666List = $(".App-content").find(".DiscussionList-discussions");

  const pan666ListData = [];
  pan666List.each(function (i, item) {
    const pan666ListTitle = $($(item).find(".DiscussionListItem-main"));
    const pan666ListTitleText = $(pan666ListTitle[0]).text();
    const pan666ListTitleHref =
      "https://pan666.net" + $(pan666ListTitle[0]).attr("href");
    const ypzyListContent = $(
      $(item).find(".DiscussionListItem-info")[0]
    ).text();
    pan666ListData.push([
      pan666ListTitleText,
      pan666ListTitleHref,
      ypzyListContent,
    ]);
  });
  return pan666ListData;
}

function getAliwpData(htmls) {
  const $ = cheerio.load(htmls);
  const aliwpList = $("#threadlist").find(".pbw");
  const aliwpListData = [];
  // ubkz格式化
  aliwpList.each(function (i, item) {
    const aliwpListTitle = $($(item).find(".xs3 a"));
    const aliwpListTitleText = $(aliwpListTitle[0]).text();
    const aliwpContent = $($(item).find("p")).text();
    aliwpListData.push([
      aliwpListTitleText,
      "https://aliwp.cn/" + $(aliwpListTitle[0]).attr("href"),
      aliwpContent,
    ]);
  });

  return aliwpListData;
}

function getCuppasoData(htmls) {
  const $ = cheerio.load(htmls);
  const cuppasoList = $(".row-cards").find(".col-12");
  const cuppasoListData = [];
  cuppasoList.each(function (i, item) {
    const cuppasoListTitle = $($(item).find("a"));
    // const cuppasoListTitleText = $(cuppasoListTitle).html;
    const cuppasoListTitleHref =
      "https://www.cuppaso.com/" + $(cuppasoListTitle[0]).attr("href");
    // const cuppasoListContent = $($(item).find("p")).text();
    cuppasoListData.push(["", cuppasoListTitleHref, ""]);
  });
  return cuppasoListData;
}

function getAlisoData(htmls) {
  const $ = cheerio.load(htmls);
  const alisoList = $(".resource-item");
  const alisoListData = [];
  alisoList.each(function (i, item) {
    const alisoListTitle = $($(item).find(".resource-title a"));
    const alisoListTitleText = $(alisoListTitle[0]).text();
    const alisoListTitleHref =
      "https://aliso.cc/" + $(alisoListTitle[0]).attr("href");
    const alisoListContent = $($(item).find(".detail-wrap")).text();
    alisoListData.push([
      alisoListTitleText,
      alisoListTitleHref,
      alisoListContent,
    ]);
  });
  return alisoListData;
}

function getXibluoData(htmls) {
  const $ = cheerio.load(htmls);
  const xibluoList = $(".websContainer");
  const xibluoListData = [];
  xibluoList.each(function (i, item) {
    const xibluoListTitle = $($(item).find(".webs a"));
    const xibluoListTitleText = $(xibluoListTitle[0]).text();
    const xibluoListTitleHref =
      "https://www.xibuluo.com/" + $(xibluoListTitle[0]).attr("href");
    const xibluoListContent = $($(item).find(".siteInfo")).text();
    xibluoListData.push([
      xibluoListContent,
      xibluoListTitleHref,
      xibluoListTitleText,
    ]);
  });
  return xibluoListData;
}

function getPikasoData(htmls) {
  const $ = cheerio.load(htmls);
  const pikasoList = $(".search-item");
  const pikasoListData = [];
  pikasoList.each(function (i, item) {
    const pikasoListTitle = $($(item).find("a"));
    const pikasoListTitleText = $(pikasoListTitle[0]).text();
    const pikasoListTitleHref = $(pikasoListTitle[0]).attr("href");
    const pikasoListContent = $($(item).find(".search-des p")).text();
    pikasoListData.push([
      pikasoListTitleText,
      pikasoListTitleHref,
      pikasoListContent,
    ]);
  });
  return pikasoListData;
}

function getSsgoData(htmls) {
  const $ = cheerio.load(htmls);
  const ssgoList = $(".v-card");
  const ssgoListData = [];
  ssgoList.each(function (i, item) {
    const ssgoListTitle = $(item);
    const ssgoListTitleText = $(ssgoListTitle[0]).find(".v-card-title").text();
    const ssgoListTitleHref = $(ssgoListTitle[0]).attr("href");
    // const ssgoListContent = $($(item).find(".search-des p")).text();
    ssgoListData.push([ssgoListTitleText, ssgoListTitleHref, ""]);
  });

  return ssgoListData;
}
function getMiaosouData(htmls) {
  // TODO：爬不下来
  const $ = cheerio.load(htmls);
  const miaosouList = $(".theme-light");
  const miaosouListData = [];
  miaosouList.each(function (i, item) {
    const miaosouListTitle = $(item).find("a");
    const miaosouListTitleText = $(miaosouListTitle[0]).find("span").text();
    const miaosouListTitleHref = $(miaosouListTitle[0]).attr("href");
    const miaosouListContent = $($(item).find(".p-3 span")).text();
    miaosouListData.push([
      miaosouListTitleText,
      miaosouListTitleHref,
      miaosouListContent,
    ]);
  });
  return miaosouListData;
}

function getPansearchData(htmls) {
  const $ = cheerio.load(htmls);
  const pansearchList = $(".whitespace-pre-wrap");
  const pansearchListData = [];
  pansearchList.each(function (i, item) {
    const pansearchListTitle = $(item).find("a");
    const pansearchListTitleText = $(pansearchListTitle[0]).find("span").text();
    const pansearchListTitleHref = $(pansearchListTitle[0]).attr("href");
    pansearchListData.push([
      "https://www.pansearch.me/",
      pansearchListTitleHref,
      pansearchListTitleText,
    ]);
  });
  return pansearchListData;
}

function getXiaobaipanData(htmls) {
  const $ = cheerio.load(htmls);
  const xiaobaipanList = $(".item-list");
  const xiaobaipanListData = [];
  xiaobaipanList.each(function (i, item) {
    const xiaobaipanListTitle = $(item).find(".job-title a");
    const xiaobaipanListTitleText = $(xiaobaipanListTitle[0]).text();
    const xiaobaipanListTitleHref =
      "https://www.xiaobaipan.com" + $(xiaobaipanListTitle[0]).attr("href");
    const xiaobaipanListContent = $($(item).find(".job-desc")).text();
    xiaobaipanListData.push([
      xiaobaipanListTitleText,
      xiaobaipanListTitleHref,
      xiaobaipanListContent,
    ]);
  });
  return xiaobaipanListData;
}

function getIizhiData(htmls) {
  const $ = cheerio.load(htmls);
  const iizhiList = $(".main-info");
  const iizhiListData = [];
  iizhiList.each(function (i, item) {
    const iizhiListTitle = $(item).find(".resource-title a");
    const iizhiListTitleText = $(iizhiListTitle[0]).attr("title");
    const iizhiListTitleHref =
      "https://www.iizhi.cn" + $(iizhiListTitle[0]).attr("href");
    const iizhiListContent = $($(item).find(".detail-wrap")).text();
    iizhiListData.push([
      iizhiListTitleText,
      iizhiListTitleHref,
      iizhiListContent,
    ]);
  });
  return iizhiListData;
}

// 磁力
// https://div.ttcl.cc/search?key=%E7%8F%A0%E5%B3%B0%E5%89%8D%E7%AB%AF&page=2&ap=1
// url: "https://div.xingqiu.icu/search?word=%E5%A4%A7%E6%A1%A5&page=1&sort=rel&ap=3",
// "https://skrbtnx.top/search?keyword=%E7%8F%A0%E5%B3%B0%E5%89%8D%E7%AB%AF2022",

// 速度慢 不好抓节点
// "https://pan666.net/?q=%E6%B2%99%E9%9B%95%E5%8A%A8%E7%94%BB",
// "https://www.alipansou.com/search?k=%E6%B2%99%E9%9B%95%E5%8A%A8%E7%94%BB",
// "https://pan.qianfan.app/search/?pan=all&q=%E6%B2%99%E9%9B%95%E5%8A%A8%E7%94%BB",
// "https://miaosou.fun/info?searchKey=%E6%B2%99%E9%9B%95%E5%8A%A8%E7%94%BB",

const crawlHTMLTarget = [
  // 1
  `https://www.ubkz.com/search.php?mod=forum&searchid=138&orderby=lastpost&ascdesc=desc&searchsubmit=yes&kw=${keyTxt}`,
  // 2
  `https://www.xuebapan.com/s/${keyTxt}-1.html`,
  // 3
  `https://www.yunpanziyuan.xyz/fontsearch.htm?fontname=${keyTxt}`,
  // 4
  `https://aliwp.cn/search.php?mod=forum&searchid=2765&orderby=lastpost&ascdesc=desc&searchsubmit=yes&kw=${keyTxt}`,
  // 5
  `https://www.cuppaso.com/search?type=1&keyword=${keyTxt}&searchType=0&page=1`,
  // 6
  `https://aliso.cc/s/${keyTxt}-1-0.html`,
  // 7
  `https://www.xibuluo.com/so/${keyTxtNamePy}/`,
  // 8
  `https://www.pikaso.top/search/?pan=all&q=${keyTxt}`,
  // 9
  `https://ssgo.app/?page=1&query=${keyTxt}`,
  // 10
  `https://www.pansearch.me/search?keyword=${keyTxt}`,
  // 11
  `https://www.xiaobaipan.com/list-${keyTxt}.html?from=1`,
  // 12
  `https://www.iizhi.cn/resource/search/${keyTxt}?searchtype=1&searchway=1`,
  // TODO：加入淘宝京东搜索
];

myXCrawl.crawlHTML(crawlHTMLTarget).then((res) => {
  // 处理
  const htmls = res.map((item) => item.data?.html);

  // ubkz格式化
  const ubkzListData = getUbkzData(htmls[0]);
  const xuebapanData = getXbpData(htmls[1]);
  const ypzyData = getYpzyData(htmls[2]);
  const aliwpData = getAliwpData(htmls[3]);
  const cuppasoData = getCuppasoData(htmls[4]);
  const alisoData = getAlisoData(htmls[5]);
  const xibuluoData = getXibluoData(htmls[6]);
  const pikasoData = getPikasoData(htmls[7]);
  const ssgoData = getSsgoData(htmls[8]);
  const pansearchData = getPansearchData(htmls[9]);
  const xiaobaipanData = getXiaobaipanData(htmls[10]);
  const iizhiData = getIizhiData(htmls[11]);

  const shellData = [
    ["名称", "链接", "介绍"],
    ...ubkzListData,
    ...xuebapanData,
    ...ypzyData,
    ...aliwpData,
    ...cuppasoData,
    ...alisoData,
    ...xibuluoData,
    ...pikasoData,
    ...ssgoData,
    ...pansearchData,
    ...xiaobaipanData,
    ...iizhiData,
    ...dataSchedule,
  ];
  var buffer = xlsx.build([
    { name: "全网数据资源爬取统计表", data: shellData },
  ]);
  fs.writeFileSync("datalist.xlsx", buffer, "binary");
});
