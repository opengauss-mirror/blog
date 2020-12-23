$(function () {
    var lang = $('html').attr('lang') === 'zh-cn' ? '/zh/' : '/en/';
    var query = new AV.Query('Counter');
    query.startsWith('url', lang);
    query.descending('time');
    query.limit(5);
    query.find().then(function (data){
        var cloneDom = null;
        data.forEach(function (item) {
            cloneDom = $('.clone-dom').clone().removeClass('hide').removeClass('clone-dom');
            cloneDom.find('a').attr('href', item.attributes.url).text(item.attributes.title);
            cloneDom.find('.name').text(item.attributes.author);
            cloneDom.find('.count').text(item.attributes.time);
            $('.top-content').append(cloneDom);
        });
    })
     $(".mask").on('touchmove',function(e){
        e.preventDefault();  //阻止默认行为
    })
    $('.h5-tag .h5-tag-header .filter').click(function () {
        if($(this).hasClass('gray')){
            return;
        }
        $(this).toggleClass('blue');
        $('.mask').toggleClass('hide');
        $('.h5-tag-content').toggleClass('hide');
        if($(this).hasClass('blue')){
            scrollTo(0, 342);
            parent.postMessage(NaN,iUrl);
            $(this).find('img').attr('src', '/img/icon-tag-blue.svg');
        }else{
            $(this).find('img').attr('src', '/img/icon-tag.svg');
        }
    });
    $('.mask').click(function () {
        $('.h5-tag .h5-tag-header .filter').trigger('click');
    })
})