import 'package:flutter/material.dart';
import 'dart:ui';

/// StatefulWidget для хедера звонка с эффектом glassmorphism
/// и анимацией "отрыва капли" при minimize
class CallHeaderWidget extends StatefulWidget {
  const CallHeaderWidget({Key? key}) : super(key: key);

  @override
  State<CallHeaderWidget> createState() => _CallHeaderWidgetState();
}

class _CallHeaderWidgetState extends State<CallHeaderWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _offsetAnimation;
  late Animation<double> _glowAnimation;
  late Animation<double> _separationAnimation;

  bool _isMinimized = false;

  @override
  void initState() {
    super.initState();

    // Контроллер анимации: 800ms, easeInOutCubic
    _controller = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    // Анимация смещения отделившейся части (0 -> 1)
    _offsetAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOutCubic,
    );

    // Пульсирующий glow (0.6 -> 1.0 -> 0.6)
    _glowAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.6, end: 1.0)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 0.6)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: 50,
      ),
    ]).animate(_controller);

    // Анимация "отрыва" формы (0 -> 1)
    _separationAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.elasticOut,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// Переключение состояния minimize/maximize
  void _toggleMinimize() {
    setState(() {
      _isMinimized = !_isMinimized;
      if (_isMinimized) {
        _controller.forward();
      } else {
        _controller.reverse();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black87,
      // GestureDetector на весь экран для тестирования
      body: GestureDetector(
        onTap: _toggleMinimize,
        behavior: HitTestBehavior.opaque,
        child: Center(
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              return Stack(
                children: [
                  // Основной хедер (остаётся на месте)
                  _buildMainHeader(),

                  // Отделившаяся часть (капля)
                  if (_controller.value > 0) _buildSeparatedPart(),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  /// Основной хедер с glassmorphism эффектом
  Widget _buildMainHeader() {
    return Positioned(
      top: 50,
      left: 20,
      right: 20,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Container(
            height: 80,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: Colors.white.withOpacity(0.2),
                width: 1.5,
              ),
            ),
            child: const Center(
              child: Text(
                'Call Header',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  /// Отделившаяся часть с анимацией и glow эффектом
  Widget _buildSeparatedPart() {
    // Смещение влево/вверх (30px)
    final offsetX = -30 * _offsetAnimation.value;
    final offsetY = -25 * _offsetAnimation.value;

    // Параметры glow
    final glowOpacity = _glowAnimation.value;
    final blurRadius = 25 + (15 * _glowAnimation.value);
    final spreadRadius = 8 + (7 * _glowAnimation.value);

    return Positioned(
      top: 50 + offsetY,
      left: 20 + offsetX,
      child: ClipPath(
        // CustomClipper для органичной формы "капли"
        clipper: _DropletClipper(progress: _separationAnimation.value),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Container(
            width: 120, // ~30% от ширины хедера
            height: 80,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              border: Border.all(
                color: Colors.greenAccent[400]!.withOpacity(glowOpacity * 0.8),
                width: 2,
              ),
              boxShadow: [
                // Ярко-зелёный пульсирующий glow
                BoxShadow(
                  color: Colors.greenAccent[400]!.withOpacity(glowOpacity),
                  blurRadius: blurRadius,
                  spreadRadius: spreadRadius,
                ),
                BoxShadow(
                  color: Colors.greenAccent[400]!.withOpacity(glowOpacity * 0.6),
                  blurRadius: blurRadius * 1.5,
                  spreadRadius: spreadRadius * 0.5,
                ),
              ],
            ),
            child: Center(
              child: Icon(
                Icons.phone,
                color: Colors.greenAccent[400],
                size: 32,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// CustomClipper для создания органичной формы "отрыва капли"
class _DropletClipper extends CustomClipper<Path> {
  final double progress;

  _DropletClipper({required this.progress});

  @override
  Path getClip(Size size) {
    final path = Path();

    // Базовая форма с закруглёнными углами
    final baseRadius = 20.0;

    // Параметры "отрыва" - чем больше progress, тем сильнее отрыв
    final separationOffset = 15 * progress;
    final neckWidth = 40 * (1 - progress * 0.6); // Сужение "шейки"

    path.moveTo(baseRadius, 0);

    // Верхняя часть
    path.lineTo(size.width - baseRadius, 0);
    path.quadraticBezierTo(
      size.width,
      0,
      size.width,
      baseRadius,
    );

    // Правая сторона с эффектом "отрыва"
    path.lineTo(size.width, size.height - baseRadius - separationOffset);

    // Закругление правого нижнего угла с "шейкой"
    path.quadraticBezierTo(
      size.width,
      size.height - separationOffset,
      size.width - baseRadius,
      size.height - separationOffset,
    );

    // Нижняя часть с сужением (эффект капли)
    path.lineTo(neckWidth + baseRadius, size.height - separationOffset);

    // Органичное закругление "отрыва"
    path.quadraticBezierTo(
      neckWidth,
      size.height - separationOffset,
      neckWidth - 5,
      size.height - baseRadius - separationOffset * 1.5,
    );

    // Левая сторона
    path.lineTo(0, baseRadius);
    path.quadraticBezierTo(0, 0, baseRadius, 0);

    path.close();
    return path;
  }

  @override
  bool shouldReclip(covariant _DropletClipper oldClipper) {
    return oldClipper.progress != progress;
  }
}
