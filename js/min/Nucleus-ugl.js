"undefined" == typeof console && (console = {
    log: function() {}
});
var Nucleus = {
        xhr: null,
        current_state: null,
        options: {},
        defaults: {
            wind_unwind_duration: 500,
            debug: !1
        },
        window_height: 0,
        window_width: 0,
        scroll_top: 0,
        globalResizeCallbacks: [],
        globalWidthResizeCallbacks: [],
        globalHeightResizeCallbacks: [],
        globalScrollVertCallbacks: [],
        heightResizeCallbacks: [],
        widthResizeCallbacks: [],
        resizeCallbacks: [],
        scrollVertCallbacks: [],
        scroll_interval: null,
        preloader: null,
        singleton_timers: {},
        is_retina: !1,
        resetScheduledTimer: function(e) {
            null !== Nucleus.singleton_timers[e] && (clearTimeout(Nucleus.singleton_timers[e]), Nucleus.singleton_timers[e] = null)
        },
        scheduleFunction: function(e, a, t) {
            Nucleus.resetScheduledTimer(e), Nucleus.singleton_timers[e] = setTimeout(function() {
                Nucleus.singleton_timers[e] = null, a()
            }, t)
        },
        trackEvent: function(e) {
            if ("undefined" != typeof ga) {
                var a = e.category,
                    t = e.action,
                    s = e.label;
                ga("send", "event", a, t, s)
            }
        },
        log: function() {
            if (Nucleus.options.debug === !0) {
                for (var e = [], a = "console.log(args)", t = 0; t < arguments.length; t++) e.push("args[" + t + "]");
                a = new Function("args", a.replace(/args/, e.join(","))), a(arguments)
            }
        },
        supportsHistoryAPI: function() {
            return window.history && window.history.pushState
        },
        pushState: function(e, a, t) {
            Nucleus.supportsHistoryAPI() && (window.history.pushState(e, "", t), Nucleus.setPageTitle(a), Nucleus.current_state = e)
        },
        replaceState: function(e, a, t) {
            Nucleus.supportsHistoryAPI() && (window.history.replaceState(e, "", t), Nucleus.setPageTitle(a), Nucleus.current_state = e)
        },
        popState: function(e) {
            null !== e.state && (Nucleus.setPageTitle(e.state.title), Nucleus.unwind(function() {
                Nucleus.loadPage(e.state.url, "replace")
            }))
        },
        setPageTitle: function(e) {
            document.title = $("<div/>").html(e).text()
        },
        loadPage: function(e, a) {
            null !== Nucleus.preloader && Nucleus.preloader.discard(), "undefined" == typeof a && (a = "push"), null !== Nucleus.xhr && Nucleus.xhr.abort(), Nucleus.xhr = $.ajax({
                url: e,
                data: {
                    ajax: 1
                },
                type: "get",
                dataType: "json",
                xhr: function() {
                    var e = $.ajaxSettings.xhr();
                    return e.addEventListener("progress", function(e) {
                        var a = 0,
                            t = e.target,
                            s = t.getResponseHeader("N-Content-Length"),
                            o = e.lengthComputable || s;
                        if (o) {
                            var n = e.lengthComputable ? e.total : s;
                            a = e.loaded / n
                        }
                        Nucleus.pageLoadProgress(e, a)
                    }), e.addEventListener("loadstart", Nucleus.pageLoadStart), e.addEventListener("loadend", Nucleus.pageLoadEnd), e
                }
            }).done(function(e, t, s) {
                200 === s.status && ("undefined" != typeof ga && ga("send", "pageview", e.url.replace(/^.*\/\/[^\/]+/, "")), Nucleus.preloadIfRequired($(e.content), function() {
                    Nucleus.afterLoadPage(e), $("#ajax").html(e.content), $("#content").find("#preload").remove(), "push" == a ? Nucleus.pushState({
                        title: e.title,
                        url: e.url
                    }, e.title, e.url) : Nucleus.replaceState({
                        title: e.title,
                        url: e.url
                    }, e.title, e.url), Nucleus.initPage(), Nucleus.presentPage()
                }))
            })
        },
        init: function(e) {
            Nucleus.options = $.extend({}, Nucleus.defaults, e), Nucleus.beforeFrameworkInit(), Nucleus.supportsHistoryAPI() && window.addEventListener("popstate", function(e) {
                Nucleus.popState(e)
            }), Nucleus.is_retina = function() {
                var e = "(-webkit-min-device-pixel-ratio: 1.5),                (min--moz-device-pixel-ratio: 1.5),                (-o-min-device-pixel-ratio: 3/2),                (min-resolution: 1.5dppx)";
                return window.devicePixelRatio > 1 ? !0 : !(!window.matchMedia || !window.matchMedia(e).matches)
            }(), Nucleus.replaceState({
                title: document.title,
                url: document.URL
            }, document.title, document.URL), Nucleus.window_width = $(window).width(), Nucleus.window_height = $(window).height(), $(window).bind("resize.Nucleus", function() {
                Nucleus.resize()
            }), $(window).bind("widthresize.Nucleus", function() {
                Nucleus.widthResize()
            }), $(window).bind("heightresize.Nucleus", function() {
                Nucleus.heightResize()
            }), Nucleus.scroll_top = $(window).scrollTop(), Nucleus.scroll_interval = setInterval(function() {
                Nucleus.scrollVert()
            }, 25), Nucleus.preloadIfRequired($("#content"), function() {
                Nucleus.initPage(), Nucleus.presentPage()
            }), Nucleus.afterFrameworkInit()
        },
        preloadIfRequired: function(e, a) {
            var t = [],
                s = $(e).find("#preload img");
            s.length > 0 && s.each(function() {
                t.push($(this).attr("src"))
            }), t.length > 0 ? (null !== Nucleus.preloader && Nucleus.preloader.discard(), Nucleus.preloader = new Preloader({
                assets: t,
                cb: function() {
                    a()
                }
            })) : a()
        },
        resize: function() {
            var e = $(window).width(),
                a = $(window).height(),
                t = Nucleus.window_width,
                s = Nucleus.window_height;
            Nucleus.window_width = e, Nucleus.window_height = a, e !== t && $(window).trigger("widthresize.Nucleus"), a !== s && $(window).trigger("heightresize.Nucleus"), Nucleus.iterateCallbackArrays(Nucleus.globalResizeCallbacks, Nucleus.resizeCallbacks)
        },
        widthResize: function() {
            Nucleus.iterateCallbackArrays(Nucleus.globalWidthResizeCallbacks, Nucleus.widthResizeCallbacks)
        },
        heightResize: function() {
            Nucleus.iterateCallbackArrays(Nucleus.globalHeightResizeCallbacks, Nucleus.heightResizeCallbacks)
        },
        scrollVert: function() {
            var e = Nucleus.scroll_top;
            Nucleus.scroll_top = $(window).scrollTop(), Nucleus.scroll_top !== e && Nucleus.iterateCallbackArrays(Nucleus.globalScrollVertCallbacks, Nucleus.scrollVertCallbacks)
        },
        addWindowCallback: function(e, a) {
            if ("function" != typeof a) return !1;
            var t = Nucleus[e + "Callbacks"];
            return Array.isArray(t) ? void t.push(a) : (console.log(e + "Callbacks", "is not a valid callback"), !1)
        },
        iterateCallbackArrays: function(e) {
            for (var a = 0; a < arguments.length; a++)
                if (Array.isArray(arguments[a]))
                    for (var t = 0; t < arguments[a].length; ++t) "function" == typeof arguments[a][t] && arguments[a][t]()
        },
        ajaxClickHandler: function(e) {
            Nucleus.supportsHistoryAPI() && (e.preventDefault(), Nucleus.ajaxPageLoad($(e.currentTarget).attr("href")))
        },
        ajaxElementHandler: function(e) {
            Nucleus.supportsHistoryAPI() && (e.preventDefault(), Nucleus.ajaxPageLoad($(this).val()))
        },
        ajaxPageLoad: function(e, a) {
            "undefined" == typeof a && (a = !1), Nucleus.supportsHistoryAPI() ? Nucleus.unwind(function() {
                Nucleus.loadPage(e)
            }) : a && (window.location = e)
        },
        initPage: function() {
            Nucleus.customInitPage()
        },
        unwindCB: function() {},
        unwind: function(e) {
            Nucleus.beforeUnwind(), "undefined" == typeof e && (e = function() {}), Nucleus.unwindCB = e, Nucleus.shouldUnwind() === !0 && Nucleus.unwindAnimationSequence()
        },
        shouldUnwind: function() {
            return !0
        },
        unwindAnimationSequence: function() {
            Nucleus.resetScheduledTimer("unwind-animation");
            var e = $("body");
            e.hasClass("loading") || (e.addClass("loading"), $("#content").animate({
                opacity: 0
            }, Nucleus.options.wind_unwind_duration, function() {
                $("#content").hide(), Nucleus.afterUnwind(), Nucleus.unwindCB(), Nucleus.unwindCB = function() {}
            }))
        },
        presentPage: function() {
            Nucleus.beforePresentPage(), Nucleus.shouldPresentPage() === !0 && Nucleus.presentPageAnimationSequence()
        },
        presentPageAnimationSequence: function() {
            $("body").removeClass("loading"), $("#content").css({
                display: "block",
                opacity: 0
            }).animate({
                opacity: 1
            }, Nucleus.options.wind_unwind_duration, function() {
                if (Nucleus.afterPresentPage(), "undefined" != typeof window.afterPresentQueue)
                    for (var e = 0; e < window.afterPresentQueue.length; e++) {
                        var a = window.afterPresentQueue[e];
                        a()
                    }
            })
        },
        shouldPresentPage: function() {
            return !0
        },
        pageLoadProgress: function(e, a) {
            $("#progress-bar").css("width", a.toFixed(1) + "%")
        },
        pageLoadStart: function(e) {
            $("#progress-bar").css("width", "0%"), $("#progress").css("opacity", 1)
        },
        pageLoadEnd: function(e) {
            $("#progress-bar").css("width", "100%"), $("#progress").css("opacity", 0)
        },
        beforeFrameworkInit: function() {},
        afterFrameworkInit: function() {},
        customInitPage: function() {
            $(".hamburger").unbind("click").click(function() {
                return $("body").hasClass("is-mobOpen") ? $("body").removeClass("is-mobOpen") : $("body").addClass("is-mobOpen"), !1
            }), $(".nav a, a.internal-link").unbind("click").click(Nucleus.ajaxClickHandler), $("a.target_blank").unbind("click").click(function() {
                return window.open($(this).attr("href")), !1
            }), $(".js-link-aggregate").unbind("click").click(function() {
                return $("html,body").stop().animate({
                    scrollTop: $("#trigger-valign").offset().top - $(window).height() / 2 + 1090
                }, 1e3), !1
            }), $(".js-link-analyse").unbind("click").click(function() {
                return $("html,body").stop().animate({
                    scrollTop: $("#trigger-valign").offset().top - $(window).height() / 2 + 3590
                }, 1e3), !1
            }), $(".js-link-publish").unbind("click").click(function() {
                return $("html,body").stop().animate({
                    scrollTop: $("#trigger-valign").offset().top - $(window).height() / 2 + 6790
                }, 1e3), !1
            }), $(".validate").each(function() {
                var e = $(this);
                e.validate()
            }), $(".wp-step-in-slow").each(function() {
                var e = $(this);
                e.waypoint(function() {
                    e.find(".step-in").each(function(e) {
                        var a = $(this);
                        setTimeout(function() {
                            a.addClass("animate")
                        }, 200 * e)
                    })
                }, {
                    triggerOnce: !0,
                    offset: "75%"
                })
            }), $(".wp-step-in-fast").each(function() {
                var e = $(this);
                e.waypoint(function() {
                    e.find(".step-in").each(function(e) {
                        var a = $(this);
                        setTimeout(function() {
                            a.addClass("animate")
                        }, 100 * e)
                    })
                }, {
                    triggerOnce: !0,
                    offset: "75%"
                })
            }), $(".wp-fade-in, .wp-panel-in").each(function() {
                var e = $(this);
                e.waypoint(function() {
                    e.addClass("animate")
                }, {
                    triggerOnce: !0,
                    offset: "75%"
                })
            }), $("#trigger-analytics").each(function(e) {
                var a = $(this);
                a.waypoint(function(e) {
                    "down" == e ? $(".panel.hero .header.main").hasClass("inactive") || $(".panel.hero .header.main").addClass("inactive").fadeOut(300) : $(".panel.hero .header.main").hasClass("inactive") && $(".panel.hero .header.main").removeClass("inactive").fadeIn(300)
                }, {
                    triggerOnce: !1,
                    offset: "0"
                })
            }), $(".accordian .title").unbind("click").click(function() {
                return $(this).hasClass("active") ? ($(this).removeClass("active").parents(".accordian-item").find(".expand").stop().slideUp(300), console.log("slide down")) : (console.log("click"), $(".accordian .title").removeClass("active"), $(".accordian .expand").stop().slideUp(300), $(this).addClass("active").parents(".accordian-item").find(".expand").stop().slideDown(300)), !1
            }), $(function() {
                $(".js-scroll").click(function() {
                    if (location.pathname.replace(/^\//, "") == this.pathname.replace(/^\//, "") && location.hostname == this.hostname) {
                        var e = $(this.hash);
                        if (e = e.length ? e : $("[name=" + this.hash.slice(1) + "]"), e.length) return $("html,body").animate({
                            scrollTop: e.offset().top
                        }, 1e3), !1
                    }
                })
            })
        },
        afterLoadPage: function(e) {},
        beforeUnwind: function() {
            window.afterPresentQueue = []
        },
        afterUnwind: function() {
            Nucleus.resizeCallbacks = [], Nucleus.widthResizeCallbacks = [], Nucleus.heightResizeCallbacks = [], Nucleus.scrollVertCallbacks = [], null !== Nucleus.person_preloader && (Nucleus.person_preloader.discard(), Nucleus.person_preloader = null), Nucleus.person_preloader_init = !1, Nucleus.personAnimationStop()
        },
        beforePresentPage: function() {
            window.scrollTo(0, 0);
            var e = $("#content").data("page");
            $("body").removeClass(function(e, a) {
                return (a.match(/(^|\s)page-\S+/g) || []).join(" ")
            }).addClass(e), $(window).width() <= 1024 && ($("body").hasClass("static") || $("body").addClass("static")), Nucleus.widthResizeCallbacks.push(function() {
                clearTimeout(Nucleus.debounce_timer), Nucleus.debounce_timer = setTimeout(function() {
                    $(window).width() <= 1024 ? $("body").hasClass("static") || ($("body").addClass("static"), "page-home" == e && Nucleus.scrollmagicDestroy(), "page-features" == e && Nucleus.scrollmagicDestroyFeatures()) : $("body").hasClass("static") && ($("body").removeClass("static"), "page-home" == e && Nucleus.scrollMagic(), "page-features" == e && Nucleus.scrollMagicFeatures()), Nucleus.debounce_timer = null, Nucleus.slick_init()
                }, 200)
            }), Nucleus.scrollVertCallbacks.push(function() {
                Nucleus.debounce_timer = setTimeout(function() {
                    if ("page-home" == e && $(window).scrollTop() > 100 ? $("body").hasClass("header-hide") || ($("body").addClass("header-hide"), $(".header.global").hide()) : $("body").hasClass("header-hide") && ($("body").removeClass("header-hide"), $(".header.global").show()), "page-home" == e && ($(window).scrollTop() > $("#trigger-valign").offset().top - $(window).height() / 2 ? $(".internal-nav").hasClass("active") || $(".internal-nav").addClass("active") : $(".internal-nav").hasClass("active") && $(".internal-nav").removeClass("active"), $(window).scrollTop() > $("#trigger-valign").offset().top - $(window).height() / 2 + 4290 ? $(".internal-nav .js-link-publish").hasClass("active") || ($(".internal-nav a").removeClass("active"), $(".internal-nav .js-link-publish").addClass("active")) : $(window).scrollTop() > $("#trigger-valign").offset().top - $(window).height() / 2 + 2090 ? $(".internal-nav .js-link-analyse").hasClass("active") || ($(".internal-nav a").removeClass("active"), $(".internal-nav .js-link-analyse").addClass("active")) : $(window).scrollTop() > $("#trigger-valign").offset().top - $(window).height() / 2 && ($(".internal-nav .js-link-aggregate").hasClass("active") || ($(".internal-nav a").removeClass("active"), $(".internal-nav .js-link-aggregate").addClass("active")))), "page-features" == e && $(window).scrollTop() < 700) {
                        var a = $(".laptop-wrap .overflow img"),
                            t = $(this).scrollTop();
                        $(window).scrollTop() <= $(window).height() && a.css({
                            transform: "translateY(-" + t / 4 + "px)"
                        })
                    }
                    Nucleus.debounce_timer = null
                }, 200)
            }), Nucleus.slick_init(), $(".header").find(".nav-active").removeClass("nav-active"), "page-home" == e ? (Nucleus.scrollMagic(), $(window).width() >= 768 , Nucleus.addWindowCallback("widthResize", function() {
                
            })) : $(".header.global").show(), "page-home" == e && $(window).scrollTop() > 100 ? $("body").hasClass("header-hide") || ($("body").addClass("header-hide"), $(".header.global").hide()) : $("body").hasClass("header-hide") && ($("body").removeClass("header-hide"), $(".header.global").show()), "page-home" == e && ($(window).scrollTop() > $("#trigger-valign").offset().top - $(window).height() / 2 ? $(".internal-nav").hasClass("active") || $(".internal-nav").addClass("active") : $(".internal-nav").hasClass("active") && $(".internal-nav").removeClass("active"), $(window).scrollTop() > $("#trigger-valign").offset().top - $(window).height() / 2 + 4290 ? $(".internal-nav .js-link-publish").hasClass("active") || ($(".internal-nav a").removeClass("active"), $(".internal-nav .js-link-publish").addClass("active")) : $(window).scrollTop() > $("#trigger-valign").offset().top - $(window).height() / 2 + 2090 ? $(".internal-nav .js-link-analyse").hasClass("active") || ($(".internal-nav a").removeClass("active"), $(".internal-nav .js-link-analyse").addClass("active")) : $(window).scrollTop() > $("#trigger-valign").offset().top - $(window).height() / 2 && ($(".internal-nav .js-link-aggregate").hasClass("active") || ($(".internal-nav a").removeClass("active"), $(".internal-nav .js-link-aggregate").addClass("active")))), "page-pricing" == e && $(".nav-pricing").addClass("nav-active"), "page-features" == e && ($(".nav-features").addClass("nav-active"), Nucleus.scrollMagicFeatures()), "page-contact" == e && $(".nav-contact").addClass("nav-active"), "page-signup" == e && $(".nav-signup").addClass("nav-active")
        },
        afterPresentPage: function() {
            var e = $("#contact-form");
            e.length && Nucleus.bindContactForm(e)
        },
        bindContactForm: function(e) {
            e.validate({
                submitHandler: function(a) {
                    var t = e.find('button[type="submit"]');
                    e.find(".notification").slideUp(500), t.prop("disabled", !0).text("Submitting...").css("cursor", "progress");
                    var s = e.serialize();
                    $.ajax({
                        url: "process-contact-form.php",
                        data: s,
                        method: "post",
                        dataType: "json"
                    }).done(function(s, o, n) {
                        "ok" == s.status ? (a.reset(), e.prepend('<p class="notification success">Thanks, your message has been sent successfully. We\'ll be in touch!</p>')) : e.prepend('<p class="notification fail">There was an issue sending your enquiry.</p>'), t.prop("disabled", !1).text("Get in touch").css("cursor", "pointer")
                    }).fail(function(a, s, o) {
                        e.prepend('<p class="notification fail">There was an issue sending your enquiry.</p>'), t.prop("disabled", !1).text("Get in touch").css("cursor", "pointer")
                    })
                }
            })
        },
        contactFormSubmitHandler: function(e) {
            console.log(e)
        },
        pathPrepare: function(e) {
            var a = e[0].getTotalLength();
            e.css("stroke-dasharray", a), e.css("stroke-dashoffset", a)
        },
        scrollMagic: function() {
            function e() {
                $(".exploding-stats").find(".count-up").each(function(e) {
                    var a = 300,
                        t = $(this).TigerUppercut({
                            duration: 1e3
                        });
                    this.count_timer = setTimeout(function() {
                        t.start()
                    }, a * e)
                })
            }
            if ($(window).width() > 1024 && device.desktop() && !$("html").hasClass("lt-ie10")) {
                ($(window).height() - $(".v-align").outerHeight()) / 2 - 30;
                $(".line").each(function() {
                    var e = $(this);
                    Nucleus.pathPrepare(e)
                }), $(".panel-floating").css({
                    top: $("#timeline-1").offset().top
                });
                var a = {
                        curve1: {
                            curviness: 1.25,
                            autoRotate: !0,
                            values: [{
                                x: 1,
                                y: 50
                            }, {
                                x: -170,
                                y: 330
                            }]
                        },
                        curve2: {
                            curviness: 1.5,
                            autoRotate: !0,
                            values: [{
                                x: 1,
                                y: 10
                            }, {
                                x: -385,
                                y: 340
                            }]
                        },
                        curve3: {
                            curviness: 2.5,
                            autoRotate: !0,
                            values: [{
                                x: 1,
                                y: 20
                            }, {
                                x: 390,
                                y: 385
                            }]
                        },
                        curve4: {
                            curviness: 3,
                            autoRotate: !0,
                            values: [{
                                x: 0,
                                y: 1
                            }, {
                                x: 330,
                                y: 215
                            }]
                        }
                    },
                    t = {
                        post1: {
                            curviness: 1.25,
                            values: [{
                                x: 20,
                                y: 20
                            }, {
                                x: 271,
                                y: -80
                            }]
                        },
                        post2: {
                            curviness: 2,
                            values: [{
                                x: 20,
                                y: 20
                            }, {
                                x: 359,
                                y: -239
                            }]
                        },
                        post3: {
                            curviness: 1.25,
                            values: [{
                                x: -20,
                                y: 20
                            }, {
                                x: -255,
                                y: -50
                            }]
                        },
                        post4: {
                            curviness: 1.25,
                            values: [{
                                x: -20,
                                y: 20
                            }, {
                                x: -343,
                                y: -209
                            }]
                        },
                        post5: {
                            curviness: 1.25,
                            values: [{
                                x: 20,
                                y: 20
                            }, {
                                x: 390,
                                y: -155
                            }]
                        },
                        post6: {
                            curviness: 1.25,
                            values: [{
                                x: 20,
                                y: 20
                            }, {
                                x: 549,
                                y: -189
                            }]
                        },
                        post7: {
                            curviness: 1.25,
                            values: [{
                                x: -20,
                                y: 20
                            }, {
                                x: -373,
                                y: -124
                            }]
                        },
                        post8: {
                            curviness: 1.25,
                            values: [{
                                x: -20,
                                y: 20
                            }, {
                                x: -532,
                                y: -159
                            }]
                        },
                        post9: {
                            curviness: 1.25,
                            values: [{
                                x: 20,
                                y: 20
                            }, {
                                x: 460,
                                y: -12
                            }]
                        },
                        post10: {
                            curviness: 1.25,
                            values: [{
                                x: 20,
                                y: 20
                            }, {
                                x: 532,
                                y: -230
                            }]
                        },
                        post11: {
                            curviness: 1.25,
                            values: [{
                                x: -20,
                                y: 20
                            }, {
                                x: -443,
                                y: 18
                            }]
                        },
                        post12: {
                            curviness: 1.25,
                            values: [{
                                x: -20,
                                y: 20
                            }, {
                                x: -516,
                                y: -200
                            }]
                        },
                        post13: {
                            curviness: 1.25,
                            values: [{
                                x: 20,
                                y: 20
                            }, {
                                x: 371,
                                y: 145
                            }]
                        },
                        post14: {
                            curviness: 1.25,
                            values: [{
                                x: 20,
                                y: 20
                            }, {
                                x: 622,
                                y: 10
                            }]
                        },
                        post15: {
                            curviness: 1.25,
                            values: [{
                                x: -20,
                                y: 20
                            }, {
                                x: -355,
                                y: 175
                            }]
                        },
                        post16: {
                            curviness: 1.25,
                            values: [{
                                x: -20,
                                y: 20
                            }, {
                                x: -606,
                                y: 40
                            }]
                        },
                        post17: {
                            curviness: 1.25,
                            values: [{
                                x: 20,
                                y: 20
                            }, {
                                x: 474,
                                y: 235
                            }]
                        },
                        post18: {
                            curviness: 1.25,
                            values: [{
                                x: 20,
                                y: 20
                            }, {
                                x: 640,
                                y: -108
                            }]
                        },
                        post19: {
                            curviness: 1.25,
                            values: [{
                                x: -20,
                                y: 20
                            }, {
                                x: -459,
                                y: 265
                            }]
                        },
                        post20: {
                            curviness: 1.25,
                            values: [{
                                x: -20,
                                y: 20
                            }, {
                                x: -623,
                                y: -78
                            }]
                        },
                        post21: {
                            curviness: 1.25,
                            values: [{
                                x: 20,
                                y: 20
                            }, {
                                x: 402,
                                y: 325
                            }]
                        },
                        post22: {
                            curviness: 1.25,
                            values: [{
                                x: 20,
                                y: 20
                            }, {
                                x: 646,
                                y: 30
                            }]
                        },
                        post23: {
                            curviness: 1.25,
                            values: [{
                                x: -20,
                                y: 20
                            }, {
                                x: -387,
                                y: 355
                            }]
                        },
                        post24: {
                            curviness: 1.25,
                            values: [{
                                x: -20,
                                y: 20
                            }, {
                                x: -630,
                                y: 60
                            }]
                        },
                        post25: {
                            curviness: 1.25,
                            values: [{
                                x: 20,
                                y: 20
                            }, {
                                x: 390,
                                y: -205
                            }]
                        },
                        post26: {
                            curviness: 1.25,
                            values: [{
                                x: 20,
                                y: 20
                            }, {
                                x: 390,
                                y: -205
                            }]
                        }
                    };
                window.waaffleController = new ScrollMagic.Controller, window.fallingPostAnimation = (new TimelineMax).add(TweenMax.to($("#timeline-0"), 1, {
                    css: {
                        opacity: 0
                    },
                    ease: Linear.easeNone,
                    delay: 1
                }), 1).add(TweenMax.to($(".falling-posts.left .post-1"), 3, {
                    css: {
                        bezier: a.curve1
                    },
                    ease: Power1.easeOut,
                    delay: 3.5
                }), 1).add(TweenMax.to($(".falling-posts.left .post-2"), 3, {
                    css: {
                        bezier: a.curve2
                    },
                    ease: Power1.easeOut,
                    delay: 2
                }), 1).add(TweenMax.to($(".falling-posts.right .post-1"), 3, {
                    css: {
                        bezier: a.curve3
                    },
                    ease: Power1.easeOut,
                    delay: 4.5
                }), 1).add(TweenMax.to($(".falling-posts.right .post-2"), 3, {
                    css: {
                        bezier: a.curve4
                    },
                    ease: Power1.easeOut,
                    delay: 6.5
                }), 1).add(TweenMax.to($("#line-1 path"), 3, {
                    strokeDashoffset: 0,
                    ease: Power1.easeOut,
                    delay: 3.6
                }), 1).add(TweenMax.to($("#line-2 path"), 3, {
                    strokeDashoffset: 0,
                    ease: Power1.easeOut,
                    delay: 2.1
                }), 1).add(TweenMax.to($("#line-3 path"), 3, {
                    strokeDashoffset: 0,
                    ease: Power1.easeOut,
                    delay: 4.6
                }), 1).add(TweenMax.to($("#line-4 path"), 3, {
                    strokeDashoffset: 0,
                    ease: Power1.easeOut,
                    delay: 6.6
                }), 1).add(TweenMax.to($("#line-1 path"), 3, {
                    opacity: 0,
                    ease: Power1.easeOut,
                    delay: 4.6
                }), 2).add(TweenMax.to($("#line-2 path"), 3, {
                    opacity: 0,
                    ease: Power1.easeOut,
                    delay: 3.1
                }), 2).add(TweenMax.to($("#line-3 path"), 3, {
                    opacity: 0,
                    ease: Power1.easeOut,
                    delay: 5.6
                }), 2).add(TweenMax.to($("#line-4 path"), 3, {
                    opacity: 0,
                    ease: Power1.easeOut,
                    delay: 7.6
                }), 2), window.fallingPosts = new ScrollMagic.Scene({
                    triggerElement: ".hero",
                    triggerHook: "onLeave",
                    duration: "800"
                }).setTween(fallingPostAnimation).addTo(waaffleController), window.collatingPostAnimation = (new TimelineMax).add(TweenMax.to($("#timeline-2"), 1, {
                    css: {
                        opacity: 1
                    },
                    ease: Linear.easeNone,
                    delay: 2
                }), 1).add(TweenMax.to($(".collated-posts .post-1"), 1, {
                    css: {
                        bezier: t.post1,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-2"), 1.4, {
                    css: {
                        bezier: t.post2,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-3"), 1.8, {
                    css: {
                        bezier: t.post3,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-4"), 2.2, {
                    css: {
                        bezier: t.post4,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-5"), 2.6, {
                    css: {
                        bezier: t.post5,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-6"), 1, {
                    css: {
                        bezier: t.post6,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-7"), 1.4, {
                    css: {
                        bezier: t.post7,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-8"), 2.2, {
                    css: {
                        bezier: t.post8,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-9"), 2.6, {
                    css: {
                        bezier: t.post9,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-10"), 3, {
                    css: {
                        bezier: t.post10,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-11"), 3.4, {
                    css: {
                        bezier: t.post11,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-12"), 3.8, {
                    css: {
                        bezier: t.post12,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-13"), 4.2, {
                    css: {
                        bezier: t.post13,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-14"), 4.6, {
                    css: {
                        bezier: t.post14,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-15"), 5, {
                    css: {
                        bezier: t.post15,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-16"), 5.4, {
                    css: {
                        bezier: t.post16,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-17"), 5.8, {
                    css: {
                        bezier: t.post17,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-18"), 6.2, {
                    css: {
                        bezier: t.post18,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-19"), 6.6, {
                    css: {
                        bezier: t.post19,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-20"), 7, {
                    css: {
                        bezier: t.post20,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-21"), 7.4, {
                    css: {
                        bezier: t.post21,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-22"), 7.8, {
                    css: {
                        bezier: t.post22,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-23"), 8.2, {
                    css: {
                        bezier: t.post23,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-24"), 8.6, {
                    css: {
                        bezier: t.post24,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-25"), 9, {
                    css: {
                        bezier: t.post25,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-26"), 9.4, {
                    css: {
                        bezier: t.post26,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-27"), 9.8, {
                    css: {
                        bezier: t.post27,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".collated-posts .post-28"), 10.2, {
                    css: {
                        bezier: t.post28,
                        backgroundColor: "white",
                        opacity: 1
                    },
                    ease: Power1.easeInOut,
                    delay: 2.5
                }), 1).add(TweenMax.to($("#timeline-2"), 1, {
                    css: {
                        opacity: 0
                    },
                    ease: Linear.easeNone,
                    delay: 15
                }), 1), window.collatePosts1 = new ScrollMagic.Scene({
                    triggerElement: "#trigger-valign",
                    triggerHook: ".5",
                    duration: "1800",
                    offset: "-250"
                }).setTween(collatingPostAnimation).addTo(waaffleController), window.collatePosts2 = new ScrollMagic.Scene({
                    triggerElement: "#trigger-valign",
                    triggerHook: ".5",
                    duration: "2100"
                }).setPin("#timeline-1").addTo(waaffleController), window.collatePosts3 = new ScrollMagic.Scene({
                    triggerElement: "#trigger-valign",
                    triggerHook: ".5",
                    duration: "7200"
                }).setPin(".panel-floating .v-align").addTo(waaffleController), window.analyticsTimeline1 = new ScrollMagic.Scene({
                    triggerElement: "#trigger-analytics",
                    triggerHook: ".5",
                    duration: "50",
                    offset: 300
                }).setTween("#timeline-5", {
                    css: {
                        opacity: 1
                    },
                    ease: Linear.easeNone
                }).addTo(waaffleController), window.analyticsAnimation = (new TimelineMax).add(TweenMax.staggerFromTo($(".proper .organised-posts .used .post"), 1, {
                    "border-width": "0"
                }, {
                    "border-width": "3px",
                    ease: Back.easeOut
                }, .02), 1).add(TweenMax.to($(".proper .organised-posts .bg"), 1, {
                    opacity: 0,
                    ease: Back.easeOut
                }, .02), 1).add(TweenMax.to($(".proper .organised-posts .graph-dot"), 1, {
                    css: {
                        width: 22,
                        height: 22,
                        "box-shadow": "0 0 0 3px #fff",
                        "border-radius": "50%"
                    },
                    ease: Power1.easeInOut,
                    delay: 0
                }), 1).add(TweenMax.to($(".proper .organised-posts .post-9"), 1, {
                    css: {
                        left: -30,
                        top: 76
                    },
                    ease: Power1.easeInOut,
                    delay: 0
                }), 1).add(TweenMax.to($(".proper .organised-posts .post-6"), 1, {
                    css: {
                        left: 27,
                        top: 46
                    },
                    ease: Power1.easeInOut,
                    delay: 0
                }), 1).add(TweenMax.to($(".proper .organised-posts .post-10"), 1, {
                    css: {
                        left: 80,
                        top: 66
                    },
                    ease: Power1.easeInOut,
                    delay: 0
                }), 1).add(TweenMax.to($(".proper .organised-posts .post-7"), 1, {
                    css: {
                        left: 133,
                        top: 36
                    },
                    ease: Power1.easeInOut,
                    delay: 0
                }), 1).add(TweenMax.to($(".proper .organised-posts .post-11"), 1, {
                    css: {
                        left: 186,
                        top: 56
                    },
                    ease: Power1.easeInOut,
                    delay: 0
                }), 1).add(TweenMax.to($(".proper .organised-posts .post-8"), 1, {
                    css: {
                        left: 242,
                        top: 26
                    },
                    ease: Power1.easeInOut,
                    delay: 0
                }), 1).add(TweenMax.to($(".proper .graph-line path"), 1, {
                    strokeDashoffset: 0,
                    ease: Power1.easeOut,
                    delay: 0
                }), 2).add(TweenMax.to($(".proper .organised-posts .graph-box"), 1, {
                    css: {
                        width: 36,
                        height: 32
                    },
                    ease: Power1.easeInOut,
                    delay: 0
                }), 1).add(TweenMax.to($(".proper .organised-posts .post-18"), 1, {
                    css: {
                        left: 24,
                        top: 210
                    },
                    ease: Power1.easeInOut,
                    delay: 0
                }), 1).add(TweenMax.to($(".proper .organised-posts .post-19"), 1, {
                    css: {
                        left: 24,
                        top: 247
                    },
                    ease: Power1.easeInOut,
                    delay: 0
                }), 1).add(TweenMax.to($(".proper .organised-posts .post-20"), 1, {
                    css: {
                        left: 24,
                        top: 284
                    },
                    ease: Power1.easeInOut,
                    delay: 0
                }), 1).add(TweenMax.staggerFromTo($(".proper .organised-posts .graph-box-line"), 1, {
                    width: 0
                }, {
                    width: 130,
                    ease: Power1.easeInOut
                }, .2), 1.5).add(TweenMax.to($(".proper .organised-posts .bar-horz"), 2, {
                    css: {
                        width: "100%"
                    },
                    ease: Back.easeOut,
                    delay: 0
                }), 1.5).add(TweenMax.to($(".proper .organised-posts .bar-vert"), 1, {
                    css: {
                        height: "100%"
                    },
                    ease: Back.easeOut,
                    delay: 0
                }), 1.5).add(TweenMax.staggerFromTo($(".proper .organised-posts .notch"), 1, {
                    width: 0
                }, {
                    width: 4,
                    ease: Back.easeOut
                }, .1), 2).add(TweenMax.staggerFromTo($(".proper .organised-posts .bar"), 1, {
                    height: 0
                }, {
                    height: 65,
                    ease: Back.easeOut
                }, .1), 2), window.analyticsTimeline2 = new ScrollMagic.Scene({
                    triggerElement: "#trigger-analytics",
                    triggerHook: ".5",
                    duration: "1800"
                }).setTween(analyticsAnimation).addTo(waaffleController), window.explodingPostAnimation = (new TimelineMax).add(TweenMax.to($(".exploding-stats"), 1, {
                    css: {
                        transform: "scale(1)"
                    },
                    ease: Linear.easeNone,
                    delay: 0,
                    onStart: e
                }), 1).add(TweenMax.to($(".exploding-stats .stat-1"), 4, {
                    css: {
                        transform: "translate(-300px, -100px)"
                    },
                    ease: Back.easeOut,
                    delay: 0
                }), 1).add(TweenMax.to($(".exploding-stats .stat-2"), 3, {
                    css: {
                        transform: "translate(-300px, 25px)"
                    },
                    ease: Back.easeOut,
                    delay: 0
                }), 1).add(TweenMax.to($(".exploding-stats .stat-3"), 2, {
                    css: {
                        transform: "translate(-300px, 150px)"
                    },
                    ease: Back.easeOut,
                    delay: 0
                }), 1).add(TweenMax.to($(".exploding-stats .stat-4"), 4, {
                    css: {
                        transform: "translate(300px, -100px)"
                    },
                    ease: Back.easeOut,
                    delay: 0
                }), 1).add(TweenMax.to($(".exploding-stats .stat-5"), 3, {
                    css: {
                        transform: "translate(300px, 25px)"
                    },
                    ease: Back.easeOut,
                    delay: 0
                }), 1).add(TweenMax.to($(".exploding-stats .stat-6"), 2, {
                    css: {
                        transform: "translate(300px, 150px)"
                    },
                    ease: Back.easeOut,
                    delay: 0
                }), 1), window.explodingTimeline = new ScrollMagic.Scene({
                    triggerElement: "#trigger-analytics",
                    triggerHook: ".5",
                    duration: "1000",
                    offset: "400"
                }).setTween(explodingPostAnimation).addTo(waaffleController), window.publishTimelineAnimation = (new TimelineMax).add(TweenMax.to($("#timeline-5"), 1, {
                    css: {
                        opacity: 0
                    },
                    ease: Linear.easeNone,
                    delay: 0
                }), 1).add(TweenMax.to($(".exploding-stats .stat"), 1, {
                    css: {
                        opacity: 0
                    },
                    ease: Linear.easeNone,
                    delay: 0
                }), 1.8), window.publishTimeline1 = new ScrollMagic.Scene({
                    triggerElement: "#trigger-publish",
                    triggerHook: ".5",
                    duration: "100"
                }).setTween(publishTimelineAnimation).addTo(waaffleController), window.publishAnimation = (new TimelineMax).add(TweenMax.to($(".analyse"), 2, {
                    height: 70,
                    ease: Back.easeInOut,
                    delay: .5
                }), 1).add(TweenMax.to($(".set-piece.set-analytics"), .5, {
                    css: {
                        opacity: 0
                    },
                    ease: Linear.easeNone,
                    delay: 0
                }), 1).add(TweenMax.to($(".set-piece.set-publish"), 3, {
                    rotation: 90,
                    ease: Back.easeInOut,
                    delay: .5
                }), 1).add(TweenMax.to($(".set-piece.set-publish"), 2, {
                    css: {
                        left: -235
                    },
                    ease: Back.easeInOut,
                    delay: 1
                }), 1).add(TweenMax.to($("#timeline-6"), 1, {
                    css: {
                        opacity: 1
                    },
                    ease: Linear.easeNone,
                    delay: 1.5
                }), 1).add(TweenMax.to($("#timeline-7"), 1, {
                    css: {
                        opacity: 1
                    },
                    ease: Linear.easeNone,
                    delay: 2.5
                }), 1).add(TweenMax.to($(".floor"), 1, {
                    css: {
                        transform: "scaleY(1)"
                    },
                    ease: Power1.easeOut,
                    delay: .5
                }), 1).add(TweenMax.to($(".cat"), 1, {
                    css: {
                        transform: "scaleY(1)"
                    },
                    ease: Power1.easeOut,
                    delay: 3
                }), 2).add(TweenMax.to($(".fred"), 1, {
                    css: {
                        transform: "translateX(0)"
                    },
                    ease: Power1.easeOut,
                    delay: 1.5
                }), 1), window.publishTimeline2 = new ScrollMagic.Scene({
                    triggerElement: "#trigger-publish",
                    triggerHook: ".5",
                    duration: "1600",
                    offset: "50"
                }).setTween(publishAnimation).addTo(waaffleController), window.publishAnimationDesk = (new TimelineMax).add(TweenMax.to($(".proper.set-piece-screen"), 1, {
                    scale: 1,
                    ease: Power1.easeOut,
                    delay: 1
                }), 0).add(TweenMax.to($(".proper .set-piece.set-publish"), 1, {
                    css: {
                        "z-index": 1,
                        "border-top": "3px solid #b9d2d5"
                    },
                    ease: Back.easeInOut,
                    delay: .5
                }), .7).add(TweenMax.staggerFromTo($(".proper.set-piece-screen .stagger"), 1, {
                    opacity: 0,
                    transform: "translateY(-5px)"
                }, {
                    opacity: 1,
                    transform: "translateY(0)",
                    ease: Power4.easeInOut
                }, .3), .7).add(TweenMax.staggerFromTo($(".proper.set-piece-screen .post"), 1, {
                    opacity: 0,
                    transform: "translateY(-5px)"
                }, {
                    opacity: 1,
                    transform: "translateY(0)",
                    ease: Power4.easeInOut
                }, .05), .7).add(TweenMax.to($(".bench"), 1, {
                    css: {
                        transform: "scaleX(1)"
                    },
                    ease: Back.easeOut,
                    delay: 0
                }), 0).add(TweenMax.staggerFromTo($(".leg"), 1, {
                    transform: "scaleY(0)"
                }, {
                    transform: "scaleY(1)",
                    ease: Power4.easeInOut
                }, .1), 0).add(TweenMax.to($(".cord"), 1, {
                    opacity: 1,
                    scale: 1,
                    ease: Power1.easeOut,
                    delay: 0
                }), 2).add(TweenMax.to($(".fred .hand"), 1, {
                    transform: "translateX(0)",
                    ease: Power1.easeOut,
                    delay: 0
                }), 3).add(TweenMax.to($(".set-piece-screen .grid"), 4, {
                    transform: "translateY(-200px)",
                    ease: Power1.easeOut,
                    delay: 1
                }), 2), window.publishTimeline3 = new ScrollMagic.Scene({
                    triggerElement: "#trigger-publish",
                    triggerHook: ".5",
                    duration: "2000",
                    offset: "900"
                }).setTween(publishAnimationDesk).addTo(waaffleController), window.handscrollTimeline1 = new ScrollMagic.Scene({
                    triggerElement: "#trigger-publish",
                    triggerHook: ".5",
                    duration: "815",
                    offset: "1800"
                }).on("enter", function() {
                    $(".fred .hand.right").addClass("animate")
                }).on("leave", function() {
                    $(".fred .hand.right").removeClass("animate")
                }).addTo(waaffleController), window.handscrollTimeline2 = new ScrollMagic.Scene({
                    triggerElement: "#trigger-publish",
                    triggerHook: ".5",
                    offset: "3400"
                }).setClassToggle("body", "demographic-animate").addTo(waaffleController), window.parallaxController = new ScrollMagic.Controller, window.parallaxHero = new ScrollMagic.Scene({
                    triggerElement: ".hero",
                    triggerHook: "onEnter",
                    duration: "200%"
                }).setTween(".hero-platform", {
                    y: "-80%",
                    ease: Linear.easeNone
                }).addTo(parallaxController), window.parallax1 = new ScrollMagic.Scene({
                    triggerElement: "#trigger-valign",
                    triggerHook: ".5",
                    duration: "200%"
                }).setTween(".parallax-1", {
                    y: "-18%",
                    ease: Linear.easeNone
                }).addTo(parallaxController), window.parallax2 = new ScrollMagic.Scene({
                    triggerElement: "#trigger-valign",
                    triggerHook: ".5",
                    duration: "200%"
                }).setTween(".parallax-2", {
                    y: "-20%",
                    ease: Linear.easeNone
                }).addTo(parallaxController), window.parallax3 = new ScrollMagic.Scene({
                    triggerElement: "#trigger-valign",
                    triggerHook: ".5",
                    duration: "200%"
                }).setTween(".parallax-3", {
                    y: "-22%",
                    ease: Linear.easeNone
                }).addTo(parallaxController)
            } else $("body").addClass("static")
        },
        scrollmagicDestroy: function() {
            waaffleController.destroy("reset"), parallaxController.destroy("reset"), waaffleController.destroy(!0), parallaxController.destroy(!0), waaffleController = null, parallaxController = null, fallingPostAnimation = null, collatingPostAnimation = null, analyticsAnimation = null, explodingPostAnimation = null, publishTimelineAnimation = null, publishAnimation = null, publishAnimationDesk = null, fallingPosts = null, collatePosts1 = null, collatePosts2 = null, collatePosts3 = null, analyticsTimeline1 = null, analyticsTimeline2 = null, explodingTimeline = null, publishTimeline1 = null, publishTimeline2 = null, publishTimeline3 = null, handscrollTimeline1 = null, handscrollTimeline2 = null, parallaxHero = null, parallax1 = null, parallax2 = null, parallax3 = null, $(".line, .analyse, .hero-platform").removeAttr("style")
        },
        scrollMagicFeatures: function() {
            if ($(window).width() > 1024 && device.desktop() && !$("html").hasClass("lt-ie10")) {
                window.featuresController = new ScrollMagic.Controller;
                var e = {
                        curImg: 0,
                        spritePosition: 0,
                        counter: 0
                    },
                    a = new SteppedEase(47);
                window.featuresAnimation = new TweenMax.to(e, .5, {
                    curImg: 47,
                    spritePosition: -16215,
                    roundProps: "curImg",
                    repeat: 0,
                    immediateRender: !0,
                    ease: a,
                    onUpdate: function() {
                        $(".feature-person-9").attr("style", "background-position: 0 " + e.spritePosition + "px")
                    }
                }), window.featureScene = new ScrollMagic.Scene({
                    triggerElement: ".feature-5",
                    triggerHook: ".75",
                    duration: "50%"
                }).setTween(featuresAnimation).addTo(featuresController), window.featureScene2 = new ScrollMagic.Scene({
                    triggerElement: ".feature-5",
                    triggerHook: ".75",
                    duration: "50%"
                }).setTween(".feature-5 .animation", {
                    x: "50px",
                    ease: Linear.easeNone
                }).addTo(featuresController)
            }
        },
        scrollmagicDestroyFeatures: function() {
            featuresController.destroy("reset"), featuresController.destroy(!0), featuresController = null, featuresAnimation = null, featuresScene = null, featuresScene2 = null, $(".person-9, .feature-5 .animation").removeAttr("style")
        },
        slick_init: function() {
            var e = Nucleus.window_width;
            $.each(slick_sliders, function(a, t) {
                $(t.selector).length > 0 && ("undefined" == typeof t.limit || null == t.limit ? $(t.selector).hasClass("slick-initialized") || ($(t.selector).slick(t.args), $("a.internal-link").unbind("click").click(Nucleus.ajaxClickHandler)) : operators[t.operator](e, t.limit) ? $(t.selector).hasClass("slick-initialized") || ($(t.selector).slick(t.args), $("a.internal-link").unbind("click").click(Nucleus.ajaxClickHandler)) : $(t.selector).hasClass("slick-initialized") && ($(t.selector).slick("unslick"), $(t.selector).find("*[tabindex='-1']").removeAttr("tabindex")))
            })
        }
    },
    slick_sliders = [{
        selector: ".demographics .col3",
        limit: "768",
        operator: "<",
        args: {
            slidesToShow: 1,
            slidesToScroll: 1,
            slide: ".col",
            speed: 300,
            dots: !0,
            arrows: !0,
            draggable: !0,
            infinite: !1,
            adaptiveHeight: !0,
            appendDots: ".hero-pager",
            prevArrow: '<button class="prev icon"><span class="u-visually-hidden">Previous</span></button>',
            nextArrow: '<button class="next icon"><span class="u-visually-hidden">Next</span></button>',
            customPaging: function(e, a) {
                return "<button></button>"
            }
        }
    }],
    operators = {
        "<": function(e, a) {
            return a > e
        },
        ">": function(e, a) {
            return e > a
        },
        "<=": function(e, a) {
            return a >= e
        },
        ">=": function(e, a) {
            return e >= a
        },
        "==": function(e, a) {
            return e == a
        }
    };