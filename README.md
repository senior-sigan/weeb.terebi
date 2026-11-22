# Weeb Terebi

Каталог онгоингов Anime 365 для телевизора Samsung с Tizen 5.5.
Electron открывает тот же бандл, который устанавливается на телевизор.

Поместите `ACCESS_TOKEN=...` в файл `.env` в корне проекта. При сборке токен попадёт в локальный виджет.

```sh
mise install
mise run app:install
mise run electron:install
mise run electron
```

Команда `mise run tv:install` собирает виджет и запускает его на телевизоре по адресу из `app/package.json`. Отдельная сборка — `mise run build`, результат — `app/dist/weebterebi.wgt`. Проверка Biome — `mise run lint`, форматирование — `mise run format`. Сборка также проверяет типы.

Стрелки перемещают фокус. Влево с первой колонки открывает меню, вправо из меню возвращает к прежней карточке. OK открывает сведения об аниме. Return на пульте или Escape в Electron возвращает в каталог.
