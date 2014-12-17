var SnakeGame = (function(d, w) {
    'use strict';

    var KEYS = {
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            P: 80,
            R: 82,
            G: 71
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
                user_controlled = opts.user_controlled,
                directionCallback = opts.directionCallback,
                current_direction,
                points = [],
                prev_last_segment_pos,
                dead = false;

            for(var x = opts.pos.x + opts.length - 1; x >= opts.pos.x; --x) {
                points.push(Point(x, opts.pos.y));
            }

            return {
                color: color,
                points: points,
                user_controlled: user_controlled,
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
                    return points.some(function(snake_point) {
                        return snake_point.x == point.x && snake_point.y == point.y;
                    });
                },
                getDirection: function() {
                    current_direction = directionCallback(points, current_direction);
                    return current_direction;
                },
                move: function(new_head_x, new_head_y) {
                    if(dead) {
                        return;
                    }
                    points.unshift(
                        Point(new_head_x, new_head_y)
                    );
                    prev_last_segment_pos = points.pop();
                },
                enlarge: function() {
                    points.push(prev_last_segment_pos);
                },
                die: function() {
                    dead = true;
                },
                isDead: function() {
                    return dead;
                }
            };
        },
        Food = function(opts) {
            var position = opts.position;
            return {
                position: position
            };
        },
        KeyEventsManager = (function() {
            var bindings = {};
            d.addEventListener('keydown', function(e) {
                if(e.keyCode in bindings) {
                    bindings[e.keyCode].forEach(function(callback) {
                        callback();
                    });
                }
            }, false);
            return {
                bind: function(keyCode, callback) {
                    if(keyCode in bindings) {
                        bindings[keyCode].push(callback);
                    } else {
                        bindings[keyCode] = [ callback ];
                    }
                },
                unbind: function(keyCode, callback) {
                    if(callback in bindings[keyCode]) {
                        bindings[keyCode].splice(bindings[keyCode].indexOf(callback), 1);
                    }
                }
            };
        })(),
        GameState = (function() {
            var STATES = {
                    PLAYING: 1,
                    PAUSED: 2,
                    GAME_OVER: 3
                },
                game_state = STATES.PLAYING;
            return {
                start: function() {
                    game_state = STATES.PLAYING;
                },
                isStarted: function() {
                    return game_state == STATES.PLAYING;
                },
                pause: function() {
                    game_state = STATES.PAUSED;
                },
                isPaused: function() {
                    return game_state == STATES.PAUSED;
                },
                over: function() {
                    game_state = STATES.GAME_OVER;
                },
                isOver: function() {
                    return game_state == STATES.GAME_OVER;
                },
            };
        })(),
        DrawingEngine = function(opts, foods, snakes) {
            var canvas = d.createElement('canvas'),
                context = canvas.getContext('2d');
            
            canvas.width = opts.width * opts.point_size;
            canvas.height = opts.height * opts.point_size;
            if(opts.canvas_id) {
                canvas.id = opts.canvas_id;
            }

            var clear = function() {
                    context.save();
                    context.scale(opts.point_size, opts.point_size);
                    context.clearRect(0, 0, opts.width, opts.height);
                    context.restore();
                },
                setFillColor = function(color) {
                    context.fillStyle = 'rgb(' + color.r + ', ' + color.g + ', ' + color.b + ')';
                },
                setStrokeColor = function(color) {
                    context.strokeStyle = 'rgb(' + color.r + ', ' + color.g + ', ' + color.b + ')';
                },
                scaleToGamePoints = function() {
                    context.scale(opts.point_size, opts.point_size);
                },
                drawPoint = function(point) {
                    context.save();
                    scaleToGamePoints();
                    context.beginPath();
                    context.arc(point.x + 0.5, point.y + 0.5, 0.5, 0, Math.PI * 2, false);
                    context.fill();
                    context.restore();
                },
                drawFood = function(food) {
                    context.save();
                    setFillColor(Color(0, 255, 0));
                    drawPoint(food.position);
                    context.restore();
                },
                drawSnake = function(snake) {
                    if(snake.isDead() && Date.now() % 500 < 250) {
                        return; // dead snake blinking
                    }
                    context.save();
                    setFillColor(snake.color);
                    snake.getBody().forEach(drawPoint);
                    setFillColor(Color(255 - snake.color.r, 255 - snake.color.g, 255 - snake.color.b));
                    drawPoint(snake.getHead());
                    context.restore();
                },
                drawGrid = function() {
                    context.save();
                    setStrokeColor(Color(200, 200, 200));
                    for(var x = 0; x <= canvas.width; x += opts.point_size) {
                        context.strokeRect(x, 0, opts.point_size, canvas.height);
                    }
                    for(var y = 0; y <= canvas.height; y += opts.point_size) {
                        context.strokeRect(0, y, canvas.width, opts.point_size);
                    }
                    context.restore();
                }, toggleGrid = function() {
                    opts.draw_grid = !opts.draw_grid;
                }, drawingLoop = function() {
                    clear();
                    if(opts.draw_grid) {
                        drawGrid();
                    }
                    foods.forEach(drawFood);
                    snakes.forEach(drawSnake);
                    requestAnimationFrame(drawingLoop);
                };
            return {
                drawingLoop: drawingLoop,
                toggleGrid: toggleGrid,
                getCanvas: function() {
                    return canvas;
                }
            };
        },
        Game = function(game_opts) {
            var current_user_direction = DIRECTIONS.RIGHT,
                last_user_moving_direction,
                snakes = [],
                foods = [],
                drawingEngine = DrawingEngine(
                    {
                        width: game_opts.width,
                        height: game_opts.height,
                        point_size: game_opts.point_size,
                        draw_grid: game_opts.draw_grid,
                        canvas_id: game_opts.canvas_id
                    },
                    foods,
                    snakes
                );

            KeyEventsManager.bind(KEYS.LEFT, function() {
                if(GameState.isStarted()) {
                    if(last_user_moving_direction != DIRECTIONS.RIGHT) {
                        current_user_direction = DIRECTIONS.LEFT;
                    }
                }
            });
            KeyEventsManager.bind(KEYS.UP, function() {
                if(GameState.isStarted()) {
                    if(last_user_moving_direction != DIRECTIONS.DOWN) {
                        current_user_direction = DIRECTIONS.UP
                    }
                }
            });
            KeyEventsManager.bind(KEYS.RIGHT, function() {
                if(GameState.isStarted()) {
                    if(last_user_moving_direction != DIRECTIONS.LEFT) {
                        current_user_direction = DIRECTIONS.RIGHT
                    }
                }
            });
            KeyEventsManager.bind(KEYS.DOWN, function() {
                if(GameState.isStarted()) {
                    if(last_user_moving_direction != DIRECTIONS.UP) {
                        current_user_direction = DIRECTIONS.DOWN
                    }
                }
            });
            KeyEventsManager.bind(KEYS.P, function() {
                if(GameState.isStarted()) {
                    GameState.pause();
                } else if(GameState.isPaused()) {
                    GameState.start();
                    gameLoop();
                }
            });
            KeyEventsManager.bind(KEYS.R, function() {
                console.log('R');
                // temporary - for test convenience
                if(GameState.isOver()) {
                    snakes = [];
                    initializeSnakes();
                    current_user_direction = DIRECTIONS.RIGHT;
                    GameState.start();
                    gameLoop();
                }
            });
            KeyEventsManager.bind(KEYS.G, function() {
                drawingEngine.toggleGrid();
            });

            var userControlledSnakeDirectionCallback = function() {
                    return current_user_direction;
                },
                computerControlledSnakeDirectionCallback = function(points, current_direction) {
                    return DIRECTIONS.RIGHT;
                },
                addSnake = function(opts) {
                    snakes.push(
                        Snake(opts)
                    );
                },
                deleteSnake = function(snake) {
                    snake.die();
                    setTimeout(function() {
                        snakes.splice(snakes.indexOf(snake), 1);
                    }, 1500);
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
                    if(snake.user_controlled) {
                        last_user_moving_direction = direction;
                    }
                },
                addFood = function() {
                    var point;
                    do {
                        point = Point(
                            parseInt(Math.random() * game_opts.width),
                            parseInt(Math.random() * game_opts.height)
                        );
                    } while(snakes.some(function(snake) { return snake.contains(point); }));
                    foods.push(
                        Food({
                            position: point
                        })
                    );
                },
                deleteFood = function(food) {
                    foods.splice(foods.indexOf(food), 1);
                },
                gameLoop = function() {
                    if(!GameState.isStarted()) {
                        return;
                    }
                    var dead_snakes = [];
                    snakes.forEach(moveSnake);
                    snakes.forEach(function(snake) {
                        if(snake.isDead()) {
                            return;
                        }
                        snakes.forEach(function(other_snake) {
                            if(other_snake.isDead()) {
                                return;
                            }
                            other_snake.points.forEach(function(point) {
                                if(snake.isHead(point) && snake.getHead() !== point) {
                                    dead_snakes.push(snake);
                                    if(snake.user_controlled) {
                                        GameState.over();
                                        return;
                                    }
                                }
                            });
                        });
                        foods.forEach(function(food) {
                            if(snake.isHead(food.position)) {
                                snake.enlarge();
                                deleteFood(food);
                            }
                        });
                    });
                    dead_snakes.forEach(deleteSnake);
                    if(foods.length < game_opts.food_count) {
                        addFood();
                    }
                    setTimeout(gameLoop, 50);
                },
                initializeSnakes = function() {
                    addSnake({
                        pos: {
                            x: 10,
                            y: 10
                        },
                        length: 5,
                        color: game_opts.snake_color,
                        user_controlled: true,
                        directionCallback: userControlledSnakeDirectionCallback
                        // directionCallback: computerControlledSnakeDirectionCallback
                    });
                    addSnake({
                        pos: {
                            x: 0,
                            y: 0
                        },
                        length: 5,
                        color: Color(150, 150, 150),
                        user_controlled: false,
                        // directionCallback: userControlledSnakeDirectionCallback
                        directionCallback: computerControlledSnakeDirectionCallback
                    });
                };

            initializeSnakes();
            drawingEngine.drawingLoop();
            gameLoop();

            return {
                getCanvas: drawingEngine.getCanvas
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