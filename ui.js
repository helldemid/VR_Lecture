$(document).ready(function () {
	$('#p').on('change', function () {
		const newP = parseFloat($(this).val());

		newP <= 0 ? $(this).val(1) : surface.setP(newP);

		surface.initBuffer(gl);
		draw();

	});

	$('#h').on('change', function () {
		const newH = parseFloat($(this).val());
		console.log(surface)
		newH <= 0 ? $(this).val(1) : surface.setH(newH);

		surface.initBuffer(gl);
		draw();
	});

	const ranges = {
		'U'    : { min: 10, max: 140, round: true },
		'V'    : { min: 10, max: 140, round: true },
		'ES'   : { min: 0.1, max: 2.0, round: false },
		'FoV'  : { min: 30, max: 120, round: true },
		'NCD'  : { min: 0.1, max: 5.0, round: false },
		'CD'   : { min: 5.0, max: 20, round: false }
	}

	$('.slider__box').each(function () {
		const $container = $(this);
		const $btn = $container.find('.slider__btn');
		const $color = $container.find('.slider__color');
		const $tooltip = $container.find('.slider__tooltip');
		const param = $container.attr('param')

		const range = ranges[param];
		if (!range) return; // если нет диапазона, не обрабатываем

		const dragElement = function ($target, $btn, range) {
			$target.on('mousedown', function (e) {
				onMouseMove(e);
				$(window).on('mousemove', onMouseMove);
				$(window).on('mouseup', onMouseUp);
			});

			const onMouseMove = function (e) {
				e.preventDefault();
				const targetOffset = $target.offset();
				const targetWidth = $target.width();
				let x = e.pageX - targetOffset.left + 10;

				if (x > targetWidth) x = targetWidth;
				if (x < 0) x = 0;

				const btnPosition = x - 10;
				$btn.css('left', btnPosition + 'px');

				// Позиция кнопки внутри контейнера в процентах
				const percentPosition = (btnPosition + 10) / targetWidth;

				const notProcessedValue = range.min + percentPosition * (range.max - range.min);
				// Вычисляем значение из диапазона
				const currentValue = range.round ? 
					Math.round(notProcessedValue)
					:
					notProcessedValue.toFixed(1);
				

				// Обновляем ширину цветного фона
				$color.css('width', percentPosition * 100 + '%');

				// Перемещаем и показываем tooltip с текущим значением
				$tooltip.css({ left: btnPosition - 5 + 'px', opacity: 1 }).text(currentValue);

				switch(param) {
					case 'V':
						surface.setVSegmentsNumber(currentValue);
						break;
					case 'U':
						surface.setUSegmentsNumber(currentValue);
						break;
					case 'ES':
						stereoParams.eyeSeparation = currentValue;
						break;
					case 'FoV':
						stereoParams.fov = currentValue;
						break;
					case 'NCD':
						stereoParams.nearClip = currentValue;
						break;
					case 'CD':
						stereoParams.convergence = currentValue;
						break;
				}
				surface.initBuffer(gl);
				draw();
			};

			const onMouseUp = function () {
				$(window).off('mousemove', onMouseMove);
				$tooltip.css('opacity', 0);

				$btn.on('mouseover', function () {
					$tooltip.css('opacity', 1);
				});

				$btn.on('mouseout', function () {
					$tooltip.css('opacity', 0);
				});
			};
		};

		dragElement($container, $btn, range);
	});


});