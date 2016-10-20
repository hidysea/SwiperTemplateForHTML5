(function () {
    'use strict';

    // 首先获取 图片与描述 填充页面
    {
        // 动画名称 上下动画配对出现
        var image_ani_names = ["bounceInLeft","bounceInDown","zoomInLeft","zoomInDown","flipInX","rollIn","fadeInLeftBig","fadeInDownBig","rotateInDownLeft","rotateInDownRight","slideInLeft","slideInDown"];
        var text_ani_names  = ["bounceInRight","bounceInUp","zoomInRight","zoomInUp","flipInY","lightSpeedIn","fadeInRightBig","fadeInUpBig","rotateInUpRight","rotateInUpLeft","slideInRight","slideInUp"];
        var bg_colors = ["#ED5565","#FC6E51","#FFCES4","#A0D468","#48CFAD","#4FC1E9","#5D9CEC","#AC92EC","#EC87C0"];
        // 获取图片列表
        var imgList = JSON.parse(localStorage.getItem("imgList"));

        var swiperWrapper = $(".swiper-wrapper");
        for (var i = 0; i < imgList.length; i++) {
            var imgUrl = imgList[i].imgUrl;
            var imgDescr = imgList[i].imgDescr;

            var image_ani_name = image_ani_names[(i % image_ani_names.length)];
            var text_ani_name = text_ani_names[(i % text_ani_names.length)];
            var bg_color = bg_colors[(i % bg_colors.length)];

            var swiperRow = '<div class="swiper-slide slide-normal" style="background-color: '+ bg_color +'">' +
                '<div class="item-image animated" data-ani-name="' + image_ani_name + '" data-ani-duration="1s" data-ani-delay="0s">' +
                '<img class="item-image-cover" src="'+ imgUrl +'"/>' +
                '</div>' +
                '<p class="item-text animated" data-ani-name="' + text_ani_name + '" data-ani-duration="1s" data-ani-delay="0.3s">' +
                imgDescr +
                '</p>' +
                '</div>'
            swiperWrapper.append(swiperRow);
        }
    }


    // load dependencies
    var animationControl = {
        initAnimationItems: function() {
            $('.animated').each(function () {
                var aniDuration, aniDelay;

                $(this).attr('data-origin-class', $(this).attr('class'));

                aniDuration = $(this).data('ani-duration');
                aniDelay = $(this).data('ani-delay');

                $(this).css({
                    'visibility': 'hidden',
                    'animation-duration': aniDuration,
                    '-webkit-animation-duration': aniDuration,
                    'animation-delay': aniDelay,
                    '-webkit-animation-delay': aniDelay
                });
            });
        },

        playAnimation: function (swiper) {
            this.clearAnimation();

            var aniItems = swiper.slides[swiper.activeIndex].querySelectorAll('.animated');

            $(aniItems).each(function () {
                var aniName;
                $(this).css({ 'visibility': 'visible' });
                aniName = $(this).data('ani-name');
                $(this).addClass(aniName);
            });
        },

        clearAnimation: function () {
            $('.animated').each(function () {
                $(this).css({ 'visibility': 'hidden' });
                $(this).attr('class', $(this).data('origin-class'));
            });
        }
    };


    $(document).ready(function () {
        var bgMusic = $('audio').get(0);
        var $btnMusic = $('.btn-music');
        var $upArrow = $('.up-arrow');

        // background music control
        $btnMusic.click(function () {
            if (bgMusic.paused) {
                bgMusic.play();
                $(this).removeClass('paused');
            } else {
                bgMusic.pause();
                $(this).addClass('paused');
            }
        });

        // init Swiper
        new Swiper('.swiper-container', {
            mousewheelControl: true,
            effect: 'coverflow',    // slide, fade, coverflow or flip
            speed: 400,
            direction: 'vertical',
            fade: {
                crossFade: false
            },
            coverflow: {
                rotate: 100,
                stretch: 0,
                depth: 300,
                modifier: 1,
                slideShadows: false     // do disable shadows for better performance
            },
            flip: {
                limitRotation: true,
                slideShadows: false     // do disable shadows for better performance
            },
            onInit: function (swiper) {
                animationControl.initAnimationItems();  // get items ready for animations
                animationControl.playAnimation(swiper); // play animations of the first slide
            },
            onTransitionStart: function (swiper) {     // on the last slide, hide .btn-swipe
                if (swiper.activeIndex === swiper.slides.length - 1) {
                    $upArrow.hide();
                } else {
                    $upArrow.show();
                }
            },
            onTransitionEnd: function (swiper) {       // play animations of the current slide
                animationControl.playAnimation(swiper);
            },
            onTouchStart: function (swiper, event) {    // mobile devices don't allow audios to play automatically, it has to be triggered by a user event(click / touch).
                if (!$btnMusic.hasClass('paused') && bgMusic.paused) {
                    bgMusic.play();
                }
            }
        });

        // hide loading animation since everything is ready
        $('.loading-overlay').slideUp();
    });
})();
