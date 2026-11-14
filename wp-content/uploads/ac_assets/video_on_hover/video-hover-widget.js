  /*
  * Unlimited Video On Hover.
  * © Unlimited Elements for Elementor, Adarsh Pawar.
  */
  
  (function (jQuery) {
    function isTouchDevice() {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    window.UEVideoHoverWidget = function (objWidget) {
      var image = objWidget.find('.ue-image')[0];
      var video = objWidget.find('.ue-video')[0];
      
      if (!video || !image) {
        console.log('Video not found (likely cookie blocked). Waiting...');
        
        var observer = new MutationObserver(function(mutations, obs) {
          if (objWidget.find('.ue-video').length) {
            obs.disconnect(); 
            
            setTimeout(function() {
              window.UEVideoHoverWidget(objWidget);
            }, 200);
          }
        });
        
        observer.observe(objWidget[0], { childList: true, subtree: true });
        return; 
      }
      
      if (video.dataset.initialized === 'true') 
        return;
      
      var isVimeo = video.tagName === 'IFRAME' && video.src.includes('vimeo.com');
      var vimeoPlayer = null;
      var vimeoReady = false;
      var isHovered = false;
      var isDebug = objWidget.attr('data-debug') === 'true';
      var g_mode = objWidget.data('mode');
      var playSound = objWidget.attr('data-play-sound') === 'true';
      var showLightbox = objWidget.attr('data-show-lightbox') === 'true';
      var enableLink = objWidget.attr('data-enable-link') === 'true';
      var linkUrl = objWidget.attr('data-link');
      var isInsideEditor = objWidget.attr('data-inside-editor') === 'true';
      var g_playingClassName = 'ue-video-playing';
      
      
      var isMouseAlreadyOver = !isTouchDevice() && (objWidget.is(':hover') || isDebug);
      
      let resetTimeout;
      
      var $video = jQuery(video);
      objWidget.on('click', function (e) {
        
        // We ONLY care about this click if the video is already playing
        if (!objWidget.hasClass(g_playingClassName)) 
          return;
        
        if(g_mode != 'play-on-click')
          return;
        
        if (isVimeo) {
          if (!vimeoPlayer) 
            vimeoPlayer = new Vimeo.Player(video);
          
          
          vimeoPlayer.getPaused().then(function (paused) {
            if (paused) {
              vimeoPlayer.play();
            } else {
              vimeoPlayer.pause();
            }
          });
        } else {
          // Standard HTML5 Video toggle
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        }
        
        // Stop propagation so we don't trigger the main widget link (data-enable-link)
        e.stopPropagation();
      });
      
      function pauseVideo(objMainWidgetWrapper, videoElem, imageElem){
        objMainWidgetWrapper.removeClass(g_playingClassName);
        imageElem.style.opacity = 1;
        imageElem.style.zIndex = 2;
        
        var dataRestart = objMainWidgetWrapper.data('restart');
        var isVimeo = videoElem.tagName === 'IFRAME' && videoElem.src.includes('vimeo.com');
        
        if (isVimeo) {
          vimeoPlayer.pause().then(function () {
            resetTimeout = setTimeout(() => {
              
              if(dataRestart == true)
                vimeoPlayer.setCurrentTime(0.01);
            }, 300);
          });
        } else {
          //works with loop html attribute
        }
      }
      
      jQuery(document).on('click', function (e) {
        // Check if the click was OUTSIDE the current widget
        if (!jQuery(e.target).closest(objWidget).length) {
          
          // Only trigger if the video is actually currently playing
          if (objWidget.hasClass(g_playingClassName)) {
            
            // If the mode is play-on-click, we hide the video
            if (g_mode === 'play-on-click') {
              hideVideo();
            }
          }
        }
      });
      
      function showVideo() {
        
        if (resetTimeout) {
          clearTimeout(resetTimeout);
          resetTimeout = null;
        }
        
        if (isVimeo && !vimeoReady) 
          return;
        
        if(!video)
          video = objWidget.find('.ue-video')[0];
        
        if (!isVimeo && video.readyState < 3) 
          return;
        
        var objAllPlayingVideosOnThePage = jQuery(`.${g_playingClassName}[data-mode="play-on-hover"]`);      
        
        objAllPlayingVideosOnThePage.each(function(){
          var objPlayingVideoWidget = jQuery(this);
          var objImage = objPlayingVideoWidget.find('.ue-image');
          var objVideo = objPlayingVideoWidget.find('.ue-video');
          
          pauseVideo(objPlayingVideoWidget, objVideo[0], objImage[0]);    
        });
        
        objWidget.addClass(g_playingClassName);
        image.style.opacity = 0;
        image.style.zIndex = 1;
        
        if (isVimeo) {
          
          if(!vimeoPlayer){
            vimeoPlayer = new Vimeo.Player(video);
          }
          
          vimeoPlayer.play();
        } else {
          video.play();
        }
      }
      
      function hideVideo() {
        
        pauseVideo(objWidget, video, image);      
      }
      
      if (!isVimeo) {
        video.muted = !playSound;
        video.preload = 'metadata';
        
        if ('IntersectionObserver' in window) {
          var observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                video.preload = 'auto';
                video.load();
                obs.unobserve(entry.target);
              }
            });
          }, {
            rootMargin: '0px',
            threshold: 0.25
          });
          
          observer.observe(video);
        } else {
          video.preload = 'auto';
        }
        
        video.addEventListener('canplay', function () {
          video.dataset.ready = 'true';
          if (isHovered || isMouseAlreadyOver) {
            isHovered = true;
            if (g_mode == 'play-on-hover')
              showVideo();
            else
              hideVideo();
          }
        });
      } else {
        vimeoPlayer = new Vimeo.Player(video);
        // Apply sound setting
        if (playSound) {
          vimeoPlayer.setVolume(1); // full volume
        } else {
          vimeoPlayer.setVolume(0); // mute
        }
        
        vimeoPlayer.setCurrentTime(0.01).then(function () {
          return vimeoPlayer.pause();
        }).then(function () {
          vimeoReady = true;
          if (isHovered || isMouseAlreadyOver) {
            isHovered = true;
            if (g_mode == 'play-on-hover')
              showVideo();
            else
              hideVideo();
          }
        });
      }
      
      if (!showLightbox) {
        
        if (!isTouchDevice() && !isDebug) {
          
          if (g_mode === 'play-on-click') {
            objWidget.on('click', function (e) {
              if (objWidget.hasClass(g_playingClassName)) {
                hideVideo();
              } else {
                showVideo();
              }
              
              e.preventDefault(); 
            });
            
            return;
          }
          
          objWidget.on('mouseenter', function () {
            isHovered = true;
            if (g_mode == 'play-on-hover')
              showVideo();
            else
              hideVideo();
          });
          
          objWidget.on('mouseleave', function () {
            isHovered = false;
            if (g_mode == 'play-on-hover')
              hideVideo();
            else
              showVideo();
          });
          
          // Accessibility: handle focus / blur for keyboard users
          objWidget.on('focus', function () {
            isHovered = true;
            if (g_mode == 'play-on-hover')
              showVideo();
            else
              hideVideo();
          });
          
          objWidget.on('blur', function () {
            isHovered = false;
            if (g_mode == 'play-on-hover')
              hideVideo();
            else
              showVideo();
          });
        } else if (!isDebug) {
          objWidget.addClass('touch-device');                                           
          
          if (g_mode === 'play-on-click') {
            objWidget.on('click', function (e) {
              if (objWidget.hasClass(g_playingClassName)) {
                hideVideo();
              } else {
                showVideo();
              }
              
              e.preventDefault(); 
            });
            
            return;
          }                                   
          
          objWidget.on('pointerup', function (e) {
            if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
            
            if (isVimeo) {
              vimeoPlayer.getPaused().then(function (paused) {
                if (paused) {
                  if (g_mode == 'play-on-hover')
                    showVideo();
                  else
                    hideVideo();
                } else {
                  if (g_mode == 'play-on-hover')
                    hideVideo();
                  else
                    showVideo();
                }
              });
            } else {
              if (video.paused && video.dataset.ready === 'true') {
                if (g_mode == 'play-on-hover')
                  showVideo();
                else
                  hideVideo();
              } else {
                if (g_mode == 'play-on-hover')
                  hideVideo();
                else
                  showVideo();
              }
            }
            
            e.stopPropagation();
          });
          
          jQuery(document).on('pointerup', function (e) {
            if (!jQuery(e.target).closest(objWidget).length) {
              if (g_mode == 'play-on-hover')
                hideVideo();
              else
                showVideo();
            }
          });
        }
        
        if (enableLink && linkUrl && g_mode !== 'play-on-click') {
          objWidget.on('click', function (e) {
            if (showLightbox || isInsideEditor) return;
            
            var linkTarget = objWidget.attr('target') || '_self';
            var linkRel = objWidget.attr('rel') || '';
            
            var newWindow = window.open(linkUrl, linkTarget);
            
            if (linkRel && (linkRel.includes('nofollow') || linkRel.includes('noopener')) && newWindow) {
              try {
                newWindow.opener = null;
              } catch (err) {
                console.warn('Unable to clear opener:', err);
              }
            }
          });
        }
      }
      
      video.dataset.initialized = 'true';
      
      var resizeTimeout;
      jQuery(window).on('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function () {
          UEVideoHoverWidget(objWidget);
        }, 300);
      });
      
      setTimeout(function () {
        if (g_mode == 'hide-on-hover')
          showVideo();
      }, 350);
    };
    
    
  })(jQuery);