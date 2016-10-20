/**
 * Created by HidyChen on 16/10/18.
 */

var imgFiles = []; // 全局的 imgFiles 存储选择的图片文件
var imgCountMax = 5; // 最多添加多少张照片
imgCountMax = 10;

$(function () {
    $(document).on("change","#input",function () {
        var input = $(this)[0]; // input 控件
        imagesChanged(input);
    });

    $(document).on("keyup",".weui_textarea",function () {
        // 输入框文字长度
        var maxLength = 50;
        var len = $(this).val().length;
        if (len > maxLength) {
            $(this).val($(this).val().substring(0, maxLength));
            len = maxLength;
        };
        $(this).parent().find("span").text(len);
    });

    $(document).on("click","#preview",function () {
        if (imgFiles.length > 0) {
            var imgList = [];
            $(".imgRow").each(function () {
                var imgObj={};
                imgObj.imgUrl=$(this).find(".weui_uploader_file").attr("src");
                imgObj.imgDescr=$(this).find(".weui_textarea").val();
                imgList.push(imgObj);
            })
            localStorage.setItem("imgList",JSON.stringify(imgList));

            // window.location.href = "preview.html";
            window.location.href = "template/index.html";
        }
    })
});

/**
 * 添加图片回调
 */
function imagesChanged(input) {
    var files = input.files;

    // 假设 "listView" 是将要展示图片的 div
    var listView = $("#listView");

    for (var i = 0; i < files.length; i++) { //新添加的图片
        var file = files[i];
        imgFiles.push(file);

        // Make sure `file.name` matches our extensions criteria
        if ( !/\.(jpe?g|png|gif)$/i.test(file.name) ) {
            continue;
        }

        // 已知三种获取 imgSrc 的方法
        // // (1)通过 file 获取 img 路径 (刷新后失效)
        // var  imgSrc = getObjectURL(file);
        // var imgRow = getImageRow(imgSrc);
        // listView.append(imgRow);

        // // (2)异步获取图片 (不能按顺序显示)
        // var reader = new FileReader();
        // reader.addEventListener("load", function () {
        //     var imgSrc = this.result;
        //     var imgRow = getImageRow(imgSrc);
        //     listView.append(imgRow);
        // }, false);
        // reader.readAsDataURL(file);

        // (3)同步获取图片 (data 数据不会失效,同步数据 顺序显示)
        var syncWorker = new Worker("js/syncWorker.js");
        if (syncWorker) {
            syncWorker.addEventListener("message",function (e) {
                var imgSrc = e.data.result;
                var imgRow = getImageRow(imgSrc,"");
                listView.append(imgRow);
            });
            syncWorker.postMessage(file);
        }

        // 最多添加 imgCountMax 张照片
        if (imgFiles.length >= imgCountMax) {
            $("#inputDiv").hide();
            break;
        }
    }
    // 切换 preview 按钮状态
    togglePreviewBtnDisable();

    // 每次添加完图片之后 替换一个新的 input
    // input 选择的文件与前一次选择的完全相同时, 将不会触发 onchange 事件
    var inputDivHtml='<div class="weui_uploader_input_wrp">'+
        '<input class="weui_uploader_input" id="input" type="file" accept="image/*" multiple="multiple" />'+
        '</div>';
    $("#inputDiv").html(inputDivHtml);
}

// 切换 preview 按钮的状态
function togglePreviewBtnDisable() {
    if (imgFiles.length > 0 && $("#preview").hasClass("weui_btn_disabled")) {
        $("#preview").removeClass("weui_btn_disabled");
    } else {
        $("#preview").addClass("weui_btn_disabled");
    }
}

// 插入一行图片
function getImageRow(imgSrc,imgDescr) {
    // 向 listView 添加一行 row
    var imgRow = '<div class="imgRow clearfix">' +
        '<div class="cell_img">' +
        '<img class="weui_uploader_file" src="' + imgSrc + '""></img>' +
        '</div>' +
        '<div class="cell_text">' +
        '<textarea class="weui_textarea" placeholder="点击输入描述" rows="3"">' +
        imgDescr +
        '</textarea>' +
        '<div class="weui_textarea_counter"><span>0</span>/50</div>' +
        '</div>' +
        '</div>';
    return imgRow;
}