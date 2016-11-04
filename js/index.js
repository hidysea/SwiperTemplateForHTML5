/**
 * Created by HidyChen on 16/10/18.
 */

var imgCountMax = 5; // 最多添加多少张照片
var imgFiles = []; // 全局的 imgFiles : 存储保存本地的图片文件列表
var up_files = []; // 全局的 up_files : 存储uploader上传文件队列
var img_urls = []; // 全局的 img_urls : 存储上传后imgUrl列表

var useQiniuUpload = true; // 预览前,是否使用七牛上传图片
var isCrossDomain = true; // uptoken_url 是否跨域
var isMixedContent = false; // 是否存在 HTTPS 和 HTTP mixed_content (比如 domain 使用 HTTPS,而uptoken_url使用的是 HTTP)

var uploader;
var qiniu_uptoken = ""; // qiniu uptoken
var qiniu_uptoken_url = "http://banapi.seenvoice.com/getTokenCover"; //qiniu uptoken_url 接口地址
// var qiniu_uptoken_url = "https://www.baidu.com/";

$(function () {
    // (1)是否使用七牛上传 切换不同 'input' 控件显示
    if (useQiniuUpload) {
        $("#inputfiles").hide();
        $("#pickfiles").show();
    } else {
        $("#inputfiles").show();
        $("#pickfiles").hide();
    }

    // (2)是否使用七牛上传 监听不同 'input' 控件事件
    if (useQiniuUpload) {
        // 初始化七牛上传 uploader
        if (qiniu_uptoken_url) {
            if (isCrossDomain) {
                if (!isMixedContent) {
                    getUptokenCrossDomain();
                } else {
                    // qiniu_uptoken 过期会失效 可能上传不成功
                    qiniu_uptoken = "aSmuxMCM4nOzDsfHKUDAUk3MMYbua6C3HyxpqRfv:tp-yB3vU05JSuD6mimaVhvMMb-g=:eyJzY29wZSI6ImNvdmVyIiwiZGVhZGxpbmUiOjE0NzczMDkyNTF9";
                    // 初始化 uploader
                    initUploader();
                }
            } else {
                // 初始化 uploader
                initUploader();
            }
        } else if (qiniu_uptoken) {
            // 初始化 uploader
            initUploader();
        } else {
            // qiniu_uptoken 过期会失效 可能上传不成功
            qiniu_uptoken = "aSmuxMCM4nOzDsfHKUDAUk3MMYbua6C3HyxpqRfv:tp-yB3vU05JSuD6mimaVhvMMb-g=:eyJzY29wZSI6ImNvdmVyIiwiZGVhZGxpbmUiOjE0NzczMDkyNTF9";
            // 初始化 uploader
            initUploader();
        }
    } else {
        // 监听 input 变化事件
        $(document).on("change","#inputfiles",function () {
            var input = $(this)[0]; // input 控件
            imagesChanged(input);
        });
    }

    // 跨域获取 uptoken 并初始化 uploader
    function getUptokenCrossDomain() {
        // 通过 JSONP 跨域获取 uptoken;
        $.ajax({
            // 服务端提供的接口地址
            // url: "https://www.baidu.com/",
            url: qiniu_uptoken_url, //接口地址,
            type: "get",
            dataType:"jsonp",
            data: {
                //上传参数
                "jsonp":1
            },
            jsonp: "callback",//传递给请求处理程序或页面的，用以获得jsonp回调函数名的参数名(一般默认为:callback)
            async: false,
            success: function (res) {
                var uptoken = res.uptoken;
                console.log(uptoken);
                // 初始化 uploader
                qiniu_uptoken = uptoken;
                initUploader();
            }
        });
    }
    // 通过 uptoken 或者 uptoken_url 初始化 uploader
    function initUploader() {
        var qiniu_up = {
            runtimes: 'html5,flash,html4',    //上传模式,依次退化
            browse_button: 'pickfiles',       //上传选择的点选按钮，**必需**

            // uptoken_url 由服务端提供获取 uptoken 的url,使用别人的 uptoken_url 存在跨域问题
            // uptoken_url: 'https://www.baidu.com/',            //Ajax请求upToken的Url，**强烈建议设置**（服务端提供）
            // uptoken : 'aSmuxMCM4nOzDsfHKUDAUk3MMYbua6C3HyxpqRfv:tp-yB3vU05JSuD6mimaVhvMMb-g=:eyJzY29wZSI6ImNvdmVyIiwiZGVhZGxpbmUiOjE0NzczMDkyNTF9', //若未指定uptoken_url,则必须指定 uptoken ,uptoken由其他程序生成

            get_new_uptoken: false,  //设置上传文件的时候是否每次都重新获取新的token
            unique_names: true, // 默认 false，key为文件名。若开启该选项，SDK为自动生成上传成功后的key（文件名）。
            save_key: true,   // 默认 false。若在服务端生成uptoken的上传策略中指定了 `sava_key`，则开启，SDK会忽略对key的处理
            domain: 'http://img.seenvoice.com/',   //bucket 域名，下载资源时用到，**必需**
            container: 'container',           //上传区域DOM ID，默认是browser_button的父元素，
            max_file_size: '100mb',           //最大文件体积限制
            flash_swf_url: 'js/plupload/Moxie.swf',  //引入flash,相对路径
            max_retries: 3,                   //上传失败最大重试次数
            dragdrop: true,                   //开启可拖曳上传
            drop_element: 'container',        //拖曳上传区域元素的ID，拖曳文件或文件夹后可触发上传
            chunk_size: '4mb',                //分块上传时，每片的体积
            auto_start: false,                 //选择文件后自动上传，若关闭需要自己绑定事件触发上传
            init: {
                'FilesAdded': function(up, files) {

                    // 假设 "listView" 是将要展示图片的 div
                    var listView = $("#listView");
                    plupload.each(files, function(file) {
                        // 文件添加进队列后,处理相关的事情
                        // uploader.files: 待上传队列; files: 新加入的文件数组; file: 新加入的文件;

                        up_files.push(file);
                        uploader.files = up_files;

                        var imgFile = file.getNative();
                        var imgSrc = getObjectURL(imgFile);
                        var imgRow = getImageRowForUpload(imgSrc,"",file.id);
                        listView.append(imgRow);

                        // 最多添加 imgCountMax 张照片
                        if (up_files.length >= imgCountMax) {
                            $("#inputDiv").hide();
                            return false; // break 的作用
                        }
                    });
                    up.files = up_files;
                    // 切换 preview 按钮状态
                    togglePreviewBtnDisable(up_files);
                },
                'BeforeUpload': function(up, file) {
                    // 每个文件上传前,处理相关的事情
                    var uploaderID = file.id;
                    var progressDiv = $("#" + uploaderID);
                    var img = progressDiv.parent();
                    img.addClass("weui_uploader_status");
                },
                'UploadProgress': function(up, file) {
                    // 每个文件上传时,处理相关的事情
                    var uploaderID = file.id;
                    var progressDiv = $("#" + uploaderID);
                    progressDiv.html(file.percent + "%");
                },
                'FileUploaded': function(up, file, info) {
                    // 每个文件上传成功后,处理相关的事情
                    // 其中 info 是文件上传成功后，服务端返回的json，形式如
                    // {
                    //    "hash": "Fh8xVqod2MQ1mocfI4S4KpRL6D98",
                    //    "key": "gogopher.jpg"
                    //  }
                    // 参考http://developer.qiniu.com/docs/v6/api/overview/up/response/simple-response.html

                    var domain = up.getOption('domain');
                    var res = JSON.parse(info);// parseJSON(info);
                    var sourceLink = domain + res.key; // 获取上传成功后的文件的Url
                    console.log(sourceLink);
                    img_urls.push(sourceLink);

                    var uploaderID = file.id;
                    var progressDiv = $("#" + uploaderID);
                    progressDiv.parent().removeClass("weui_uploader_status");
                    progressDiv.hide();
                },
                'Error': function(up, err, errTip) {
                    //上传出错时,处理相关的事情
                    console.log(err,errTip);
                    alert(errTip);
                },
                'UploadComplete': function() {
                    //队列文件处理完毕后,处理相关的事情
                    console.log("UploadComplete");

                    var imgList = [];
                    $(".imgRow").each(function () {
                        var imgObj={};
                        imgObj.imgUrl=$(this).find(".weui_uploader_file").attr("src");
                        imgObj.imgDescr=$(this).find(".weui_textarea").val();
                        imgList.push(imgObj);
                    });
                    for (var i = 0; i < up_files.length; i++) {
                        imgList[i].imgUrl = img_urls[i];
                    }
                    // 注意: 使用 localStorage 存储数据 限制 5M 以内
                    localStorage.removeItem("imgList");
                    localStorage.setItem("imgList",JSON.stringify(imgList));

                    window.location.href = "template/index.html";
                },
                'Key': function(up, file) {
                    // 若想在前端对每个文件的key进行个性化处理，可以配置该函数
                    // 该配置必须要在 unique_names: false , save_key: false 时才生效

                    var key = "";
                    // do something with key here
                    return key
                }
            }
        };
        if (qiniu_uptoken_url && !isCrossDomain) {
            qiniu_up.uptoken_url = qiniu_uptoken_url;
        } else {
            qiniu_up.uptoken = qiniu_uptoken;
        }

        // 引入Plupload 、qiniu.js后
        uploader = Qiniu.uploader(qiniu_up);
        // domain 为七牛空间（bucket)对应的域名，选择某个空间后，可通过"空间设置->基本设置->域名设置"查看获取
        // uploader 为一个plupload对象，继承了所有plupload的方法，参考http://plupload.com/docs
    }

    // 输入框文字变化事件
    $(document).on("keydown",".weui_textarea",function () {
        // 输入框文字长度
        var maxLength = 50;
        var len = $(this).val().length;
        if (len > maxLength) {
            $(this).val($(this).val().substring(0, maxLength));
            len = maxLength;
        };
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

    // 点击预览事件
    $("#preview").click(function () {
        if (useQiniuUpload) {
            // (1) 上传图片 ==》 上传后跳转到预览界面
            if (uploader.total.percent == 0) {
                uploader.start();
            }
        } else {
            // (2)本地存储图片 并跳转到预览页面
            // 直接存储图片到本地有大小限制,采取先上传的方式更好
            if (imgFiles.length > 0) {
                var imgList = [];
                $(".imgRow").each(function () {
                    var imgObj={};
                    imgObj.imgUrl=$(this).find(".weui_uploader_file").attr("src");
                    imgObj.imgDescr=$(this).find(".weui_textarea").val();
                    imgList.push(imgObj);
                });
                // 注意: 使用 localStorage 存储数据 限制 5M 以内
                localStorage.removeItem("imgList");
                localStorage.setItem("imgList",JSON.stringify(imgList));

                window.location.href = "template/index.html";
            }
        }
    });
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
        if ( !(/\.(jpe?g|png|gif)$/i.test(file.name)) ) {
            continue;
        }

        // 已知三种获取 imgSrc 的方法
        // // (1)通过 file 获取 img 路径 (失效后不能传值)
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
    togglePreviewBtnDisable(imgFiles);

    // 每次添加完图片之后 替换一个新的 input
    // input 选择的文件与前一次选择的完全相同时, 将不会触发 onchange 事件
    var inputDivHtml='<div class="weui_uploader_input_wrp">'+
        '<input class="weui_uploader_input" id="input" type="file" accept="image/*" multiple="multiple" />'+
        '</div>';
    $("#inputDiv").html(inputDivHtml);
}

// 切换 preview 按钮的状态
function togglePreviewBtnDisable(imgFiles) {
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

// 插入一行图片
function getImageRowForUpload(imgSrc,imgDescr,uploaderID) {
    // 向 listView 添加一行 row
    var imgRow = '<div class="imgRow clearfix">' +
        '<ul class="cell_img weui_uploader_files">' +
        // '<img class="weui_uploader_file weui_uploader_status" src="' + imgSrc + '"">' +
        '<li class="weui_uploader_file" style="background-image: url(' + imgSrc + ')"">' +
        '<div class="weui_uploader_status_content" id="'+ uploaderID +'"></div>' +
        '</li>' +
        '</ul>' +
        '<div class="cell_text">' +
        '<textarea class="weui_textarea" placeholder="点击输入描述" rows="3"">' +
        imgDescr +
        '</textarea>' +
        '<div class="weui_textarea_counter"><span>0</span>/50</div>' +
        '</div>' +
        '</div>';
    return imgRow;
}
