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
                last_user_moving_direction,
                snakes = [],
                foods = [];

            d.addEventListener('keydown', function(e) {
                console.log(e.keyCode);
                switch(game_state) {
                    case STATES.PLAYING:
                        switch(e.keyCode) {
                            case KEYS.LEFT:
                                if(last_user_moving_direction != DIRECTIONS.RIGHT) {
                                    current_user_direction = DIRECTIONS.LEFT
                                }
                                break;
                            case KEYS.UP:
                                if(last_user_moving_direction != DIRECTIONS.DOWN) {
                                    current_user_direction = DIRECTIONS.UP
                                }
                                break;
                            case KEYS.RIGHT:
                                if(last_user_moving_direction != DIRECTIONS.LEFT) {
                                    current_user_direction = DIRECTIONS.RIGHT
                                }
                                break;
                            case KEYS.DOWN:
                                if(last_user_moving_direction != DIRECTIONS.UP) {
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
                                initializeSnakes();
                                current_user_direction = DIRECTIONS.RIGHT;
                                game_state = STATES.PLAYING;
                                gameLoop();
                                break;
                        }
                        break;
                }
                switch(e.keyCode) {
                    case KEYS.G:
                        game_opts.draw_grid = !game_opts.draw_grid;
                        break;
                }
            }, false);

            var clear = function() {
                    context.clearRect(0, 0, game_opts.width, game_opts.height);
                },
                setFillColor = function(color) {
                    context.fillStyle = 'rgb(' + color.r + ', ' + color.g + ', ' + color.b + ')';
                },
                setStrokeStyle = function(color) {
                    context.strokeStyle = 'rgb(' + color.r + ', ' + color.g + ', ' + color.b + ')';
                },
                drawPoint = function(point) {
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
                    if(snake.isDead() && Date.now() % 500 < 250) {
                        return;
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
                    setStrokeStyle(Color(245, 245, 245));
                    for(var x = 0.5; x <= game_opts.width; x += 2) {
                        context.beginPath();
                        context.moveTo(x, 0);
                        context.lineTo(x, game_opts.height);
                        context.stroke();
                    }
                    for(var y = 0.5; y <= game_opts.height; y += 2) {
                        context.beginPath();
                        context.moveTo(0, y);
                        context.lineTo(game_opts.width, y);
                        context.stroke();
                    }
                    context.restore();
                },
                drawingLoop = function() {
                    clear();
                    if(game_opts.draw_grid) {
                        drawGrid();
                    }
                    foods.forEach(drawFood);
                    snakes.forEach(drawSnake);
                    requestAnimationFrame(drawingLoop);
                },
                userControlledSnakeDirectionCallback = function() {
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
                    if(game_state != STATES.PLAYING) {
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
                                        game_state = STATES.GAME_OVER;
                                        return;
                                    }
                                }
                            });
                        });
                        foods.forEach(function(food) {
                            if(snake.isHead(food.position)) {
                                // game_opts.onFoodEaten();
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
            drawingLoop();
            gameLoop();

            return {
                getCanvas: function() {
                    return canvas;
                }
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