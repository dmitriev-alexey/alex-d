var $ = jQuery;

// for aspect ratio
(function(){
	var ratio = "16:9";
	$.fn.setAspectRatio = function(ratioNew) {
		if ( ratioNew ) {
			ratio = ratioNew;
		}

		var rationLn = ratio.split(":");

		$(this).each(function(){
			var item = $(this);
			if ( item.length > 0 ) {
				var itemWidth = item.width();
				var aspectHeight = ( itemWidth * rationLn[1]/rationLn[0] );
				item.height(aspectHeight);
			}
		});
	};
}());

// callback after ready the document
$(document).ready(function(){

	$('.search-form-li').on('click',function(e){
		e.stopPropagation();
		$('.search-form-li').find('#initSearchIcon').addClass('hide');
		$('.search-form-wrap').removeClass('hide').find('input.search').focus();
		$('.side-nav').addClass('hide');
	});

	$(window).on('click',function(){
		$('.search-form-li').find('#initSearchIcon').removeClass('hide');
		$('.search-form-wrap').addClass('hide');
		$('.side-nav').removeClass('hide');
	});



	$(".blog-submenu-init").dropdown({
		inDuration: 300,
		outDuration: 225,
		constrain_width: true,
		hover: false,
		alignment: 'right',
		gutter: 10,
		belowOrigin: true
	});


	$(".primary-nav .button-collapse").sideNav();

	// setting the post thumb height depend on aspect ratio 16:9
	$('.blog-post-thumb.videoPost').setAspectRatio();


	// jwplayer video post
	(function(){
		$('.player').each(function(){
			var $this = $(this),
			defaults = {
				fileSrc : '',
				imageSrc : '',
				id : '',
				width : '100%',
				height : '100%',
				aspectratio : ''
			},
			config = {
				fileSrc : $(this).data('file-sec') || defaults.fileSrc,
				imageSrc : $(this).data('image-src') || defaults.imageSrc,
				id : $(this).attr('id'),
				width : $(this).data('width') || defaults.width,
				height : $(this).data('height') || defaults.height,
				aspectratio : $(this).data('aspectratio') || defaults.aspectratio
			};

			jwplayer(config.id).setup({
				file: config.fileSrc,
				image: config.imageSrc,
				width: config.width,
				height: config.height,
				aspectratio : config.aspectratio
			});
		});
	}());


	// $("html").niceScroll({
	// 	cursorwidth: '7px',
	// 	zindex: '9999999'
	// });

});


// callback after loading the window
$(window).load(function(){

    // Preloader
    $('.loader').fadeOut();
    $('#preloader').delay(100).fadeOut('slow');
    $('body').delay(100);

	// blog post slider
	(function(){
		var $blog_post_slider  = $('.thumb-slides-container');
		if ( $blog_post_slider.length > 0 ) {

			$blog_post_slider.each(function(){
				$(this).owlCarousel({
					singleItem : true,
				    autoPlay : true,
				    stopOnHover : true,
					slideSpeed : 800,
					transitionStyle : 'fade'
				});
			});

			$('.thumb-slides-controller a').on('click',function(e){
				e.preventDefault();

				var blog_post_slider_data = $(this).closest('.blog-post-thumb').children('.thumb-slides-container').data('owlCarousel');

				if ( $(this).hasClass('left-arrow') ) {
					blog_post_slider_data.prev();
				} else {
					blog_post_slider_data.next();
				}
			});
		}
	}());


	// favorite maker
	(function(){
		var lovedText = "You already love this", loveText = "Love this", loveClass = "active";
		$('.js-favorite').on('click', function(e){
			e.preventDefault();
			var favoriteNumb = parseInt( $(this).find('.numb').text(), 10 );
			if ( $(this).hasClass(loveClass) ) {
				$(this).removeClass(loveClass).attr('title', loveText);
				--favoriteNumb;
				$(this).find('.numb').text( favoriteNumb );
			} else {
				$(this).addClass(loveClass).attr('title', lovedText);
				++favoriteNumb;
				$(this).find('.numb').text( favoriteNumb );
			}
		});
	}());


	// blog Mesonary
	if ( $('#blog-posts').length > 0 ) {
		var blogMsnry = $('#blog-posts').isotope({
			itemSelector: '.single-post',
			layoutMode: 'masonry'
		});
	}

});


// callback after resize the window
$(window).resize(function(){

	// setting the post thumb height depend on aspect ratio 16:9
	$('.blog-post-thumb.videoPost').setAspectRatio();

});