/**
 * 可伸缩布局方案
 * rem计算方式：设计图尺寸px / 100 = 实际rem  例: 100px = 1rem
 */
!function (window) {

    var pageurl = window.location.href;
    var langss = document.querySelector("html").lang === "zh-cn" ? "zh" : "en";



    var url = document.getElementById("iframeUrl").value;
    var domLoadFlag = 1;

    function observe(el, options, callback) {
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver
        var observer = new MutationObserver(callback)
        observer.observe(el, options)
    }

    var options = {
        childList: true,
        subtree: true,
        characterData: true
    }
    observe(document.body, options, (records, instance) => {
        setTimeout(function () {
            var height = $("body").height();
            domLoadFlag && parent.postMessage(height, url);
        }, 500)
        setTimeout(function () {
            domLoadFlag = 0;
        }, 7000)
    })
    if (pageurl.split(langss + "/")[1]) parent.postMessage(pageurl.split(langss + "/")[1], url);


    if (document.querySelector("#notFound")) parent.postMessage("我404了", url);

    // if (langss=== "zh") {
    //     $('h1,h2,h3,h4,h5,div,p,a,li,span').each(function () {
    //         if (!$(this).attr('style')) {
    //             $(this).attr("style", "font-family:FZLTHJW !important");
    //         }
    //     })
    // } else {
    //     $('h1,h2,h3,h4,h5,div,p,a,li,span').each(function () {
    //         if (!$(this).attr('style')) {
    //             $(this).attr("style", "font-family:Roboto-Regular !important");
    //         }
    //     })
    // }


    /* 设计图文档宽度 */
    var docWidth = 750;

    var doc = window.document,
        docEl = doc.documentElement,
        resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize';

    var recalc = (function refreshRem() {
        var clientWidth = docEl.getBoundingClientRect().width;

        /* 8.55：小于320px不再缩小，11.2：大于420px不再放大 */
        docEl.style.fontSize = Math.max(Math.min(20 * (clientWidth / docWidth), 11.2), 8.55) * 5 + 'px';

        return refreshRem;
    })();

    /* 添加倍屏标识，安卓为1 */
    docEl.setAttribute('data-dpr', window.navigator.appVersion.match(/iphone/gi) ? window.devicePixelRatio : 1);

    if (/iP(hone|od|ad)/.test(window.navigator.userAgent)) {
        /* 添加IOS标识 */
        doc.documentElement.classList.add('ios');
        /* IOS8以上给html添加hairline样式，以便特殊处理 */
        if (parseInt(window.navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/)[1], 10) >= 8)
            doc.documentElement.classList.add('hairline');
    }

    if (!doc.addEventListener) return;
    window.addEventListener(resizeEvt, recalc, false);
    doc.addEventListener('DOMContentLoaded', recalc, false);

}(window);