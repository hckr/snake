var SnakeGame = (function(d, w) {
    'use strict';

    var STATES = {
            PLAYING: 1,
            PAUSED: 2,
            GAME_OVER: 3
        },
        KEYS = {
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            P: 80,
            R: 82
        },
        DIRECTIONS = {
            UP: {
                x: 0,
                y: -1
            },
            RIGHT: {
                x: 1,
                y: 0
            },
            DOWN: {
                x: 0,
                y: 1
            },
            LEFT: {
                x: -1,
                y: 0
            }
        },
        Color = function(r, g, b) {
            return {
                r: r,
                g: g,
                b: b
            };
        },
        Point = function(x, y) {
            return {
                x: x,
                y: y
            };
        },
        Snake = function(opts) {
            var color = opts.color,
                directionCallback = opts.directionCallback,
                points = [],
                prev_last_segment_pos;

            for(var x = opts.length - 1; x >= 0; --x) {
                points.push(Point(x, 0));
            }

            return {
                color: color,
                points: points,
                getHead: function() {
                    return points[0];
                },
                isHead: function(point) {
                    var head = points[0];
                    return head.x == point.x && head.y == point.y;
                },
                getBody: function() {
                    return points.slice(1);
                },
                contains: function(point) {
                    points.forEach(function(snake_point) {
                        if(snake_point.x == point.x && snake_point.y == point.y) {
                            return true;
                        }
                    });
                    return false;
                },
                getDirection: function() {
                    return directionCallback(points);
                },
                move: function(new_head_x, new_head_y) {
                    points.unshift(
                        Point(new_head_x, new_head_y)
                    );
                    prev_last_segment_pos = points.pop();
                },
                enlarge: function() {
                    points.push(prev_last_segment_pos);
                }
            };
        },
        Food = function(opts) {
            var position = opts.position;
            return {
                position: position
            };
        },
        Game = function(game_opts) {
            var canvas = d.createElement('canvas');
            canvas.width = game_opts.width * game_opts.point_size;
            canvas.height = game_opts.height * game_opts.point_size;
            if(game_opts.canvas_id) {
                canvas.id = game_opts.canvas_id;
            }

            var context = canvas.getContext('2d');
            context.scale(game_opts.point_size, game_opts.point_size);

            var game_state = STATES.PLAYING,
                current_user_direction = DIRECTIONS.RIGHT,
                last_moving_direction,
                snakes = [],
                foods = [];

            d.addEventListener('keydown', function(e) {
                switch(game_state) {
                    case STATES.PLAYING:
                        switch(e.keyCode) {
                            case KEYS.LEFT:
                                if(last_moving_direction != DIRECTIONS.RIGHT) {
                                    current_user_direction = DIRECTIONS.LEFT
                                }
                                break;
                            case KEYS.UP:
                                if(last_moving_direction != DIRECTIONS.DOWN) {
                                    current_user_direction = DIRECTIONS.UP
                                }
                                break;
                            case KEYS.RIGHT:
                                if(last_moving_direction != DIRECTIONS.LEFT) {
                                    current_user_direction = DIRECTIONS.RIGHT
                                }
                                break;
                            case KEYS.DOWN:
                                if(last_moving_direction != DIRECTIONS.UP) {
                                    current_user_direction = DIRECTIONS.DOWN
                                }
                                break;
                            case KEYS.P:
                                game_state = STATES.PAUSED;
                                break;
                        }
                        break;
                    case STATES.PAUSED:
                        switch(e.keyCode) {
                            case KEYS.P:
                                game_state = STATES.PLAYING;
                                gameLoop();
                                break;
                        }
                        break;
                    case STATES.GAME_OVER:
                        switch(e.keyCode) {
                            case KEYS.R:
                                snakes = [];
                                addSnake({
                                    color: Color(0, 120, 255),
                                    length: 10,
                                    user_controlled: true
                                });
                                current_user_direction = DIRECTIONS.RIGHT;
                                game_state = STATES.PLAYING;
                                gameLoop();
                                break;
                        }
                        break;
                }
            }, false);

            var getCanvas = function() {
                    return canvas;
                },
                clear = function() {
                    context.clearRect(0, 0, game_opts.width, game_opts.height);
                },
                setFillColor = function(color) {
                    context.fillStyle = 'rgb(' + color.r + ', ' + color.g + ', ' + color.b + ')';
                },
                drawPoint = function(point) {
                    // context.fillRect(point.x, point.y, 1, 1);
                    context.beginPath();
                    context.arc(point.x + 0.5, point.y + 0.5, 0.5, 0, Math.PI * 2, false);
                    context.fill();
                },
                drawFood = function(food) {
                    context.save();
                    setFillColor(Color(0, 255, 0));
                    drawPoint(food.position);
                    context.restore();
                },
                drawSnake = function(snake) {
                    context.save();
                    setFillColor(snake.color);
                    snake.getBody().forEach(drawPoint);
                    setFillColor(Color(255 - snake.color.r, 255 - snake.color.g, 255 - snake.color.b));
                    drawPoint(snake.getHead());
                    context.restore();
                },
                drawingLoop = function() {
                    clear();
                    foods.forEach(drawFood);
                    snakes.forEach(drawSnake);
                    requestAnimationFrame(drawingLoop);
                },
                addSnake = function(opts) {
                    if(opts.user_controlled) {
                        opts.directionCallback = function() {
                            return current_user_direction;
                        }
                    } else {
                        opts.directionCallback = function() {
                            return DIRECTIONS.RIGHT;
                        }
                    }
                    snakes.push(
                        Snake(opts)
                    );
                },
                moveSnake = function(snake) {
                    var curr_head = snake.getHead(),
                        direction = snake.getDirection(),
                        new_x = (curr_head.x + direction.x) % game_opts.width,
                        new_y = (curr_head.y + direction.y) % game_opts.height;
                    if(new_x < 0) {
                        new_x += game_opts.width;
                    }
                    if(new_y < 0) {
                        new_y += game_opts.height;
                    }
                    snake.move(new_x, new_y);
                    last_moving_direction = direction;
                },
                addFood = function() {
                    var point,
                        any_snake_contains = false;
                    do {
                        point = Point(
                            parseInt(Math.random() * game_opts.width),
                            parseInt(Math.random() * game_opts.height)
                        );
                        snakes.forEach(function(snake) {
                            if(snake.contains(point)) {
                                any_snake_contains = true;
                            }
                        });
                    } while(any_snake_contains);
                    foods.push(
                        Food({
                            position: point
                        })
                    );
                },
                gameLoop = function() {
                    if(game_state != STATES.PLAYING) {
                        return;
                    }
                    snakes.forEach(function(snake) {
                        moveSnake(snake);
                        snake.getBody().forEach(function(point) {
                            if(snake.isHead(point)) {
                                game_state = STATES.GAME_OVER;
                                return;
                            }
                        })
                        foods.forEach(function(food) {
                            if(snake.isHead(food.position)) {
                                // game_opts.onFoodEaten();
                                snake.enlarge();
                                foods.splice(foods.indexOf(food), 1);
                            }
                        });
                    });
                    if(foods.length == 0) {
                        addFood();
                    }
                    setTimeout(gameLoop, 50);
                };

            addSnake({
                color: game_opts.snake_color,
                length: 10,
                user_controlled: true
            });
            drawingLoop();
            gameLoop();

            return {
                getCanvas: getCanvas
            };
        },
        exports = function(opts) {
            var game = Game(opts);
            return {
                appendTo: function(el) {
                    return el.appendChild(game.getCanvas());
                }
            };
        };

    exports.Color = Color;
    return exports;
})(document, window);