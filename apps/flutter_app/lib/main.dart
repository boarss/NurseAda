import 'package:flutter/material.dart';
import 'package:nurseada_flutter/screens/home_screen.dart';
import 'package:nurseada_flutter/screens/chat_screen.dart';

void main() {
  runApp(const NurseAdaApp());
}

class NurseAdaApp extends StatelessWidget {
  const NurseAdaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NurseAda',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF059669)),
        useMaterial3: true,
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const HomeScreen(),
        '/chat': (context) => const ChatScreen(),
      },
    );
  }
}
