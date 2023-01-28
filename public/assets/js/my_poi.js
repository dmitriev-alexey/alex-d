var myMap;

// Дождёмся загрузки API и готовности DOM.
ymaps.ready(init);

function init() {
    // Создание экземпляра карты и его привязка к контейнеру с
    // заданным id ("map").
    myMap = new ymaps.Map('map', {
        // При инициализации карты обязательно нужно указать
        // её центр и коэффициент масштабирования.
        center: [53.895989, 27.498741], // Москва
        zoom: 12
    }, {
        searchControlProvider: 'yandex#search'
    });

    myMap.geoObjects
        .add(new ymaps.Placemark([53.894473, 27.530539], {
            balloonContent: 'Hi! I hope you fine! :)'
        }, {
            preset: 'islands#icon',
            iconColor: '#ff0000'
        }));
}