$(function () {
    new Pagination({
        element: '#pagination',
        type: 2,
        pageIndex: curPage,
        pageSize: 5,
        pageCount: 1,
        total: total,
        jumper: true,
        singlePageHide: false,
        prevText: '<',
        nextText: '>',
        disabled: true,
        currentChange: function(index) {
            window.location.href = '/' + lang + '/page/' + index + '/';
        }
    });
})