window.GOODDO_TEAM = {
  source: 'https://gooddo.ru/',
  fps: 24,
  duration: 18.125,
  video: 'assets/team/team-route.mp4',
  mobileVideo: 'assets/team/team-route-mobile.mp4',
  // Reserved slots for the two future generated passages. No video is requested here.
  entry: {kind: 'placeholder', src: null, poster: 'assets/hero-static.webp'},
  exit: {kind: 'placeholder', src: null, poster: 'assets/hero-static.webp'},
  people: [
    {id: 'ramil', name: 'Рамиль Арифуллов', shortName: 'Рамиль', role: 'CEO, генеральный продюсер', time: 0, poster: 'assets/team/stills/01-ramil.jpg', crop: 45, side: 'left'},
    {id: 'maksim', name: 'Максим Лебедев', shortName: 'Максим', role: 'ИИ-специалист, продюсер по графике и анимации', time: 6, poster: 'assets/team/stills/02-maksim.jpg', crop: 62, side: 'left'},
    {id: 'sergey', name: 'Сергей Гарник', shortName: 'Сергей', role: 'Главный по съёмкам', time: 12.0416666667, poster: 'assets/team/stills/03-sergey.jpg', crop: 20, side: 'right'},
    {id: 'valeria', name: 'Валерия Свиридова', shortName: 'Валерия', role: 'Менеджер проектов', time: 18.0833333333, poster: 'assets/team/stills/04-valeria.jpg', crop: 60, side: 'left'}
  ],
  clips: [
    {source: 'gallery-team-flythrough-1-to-2.mp4', start: 0, end: 6.0416666667, from: 'ramil', to: 'maksim'},
    {source: 'gallery-team-flythrough-2-to-3.mp4', start: 6.0416666667, end: 12.0833333333, from: 'maksim', to: 'sergey'},
    {source: 'gallery-team-flythrough-3-to-4.mp4', start: 12.0833333333, end: 18.125, from: 'sergey', to: 'valeria'}
  ]
};
