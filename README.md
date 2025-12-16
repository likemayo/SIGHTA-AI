# SIGHTA-AI

A smart necklace navigation system for people with visual impairments using AI-powered segmentation and audio feedback.

## Project Overview

SIGHTA-AI develops a wearable necklace device that provides real-time navigation assistance to visually impaired users. The system uses an integrated camera and segmentation model to analyze the environment and deliver audio-based navigation instructions through built-in speakers.

## Hardware Components

- **ESP32-CAM** modules for image capture and processing
- **Camera** for environment sensing
- **Microphone** for voice commands
- **Speakers** for audio feedback
- **FTDI adapters** for firmware flashing

## Software Architecture

The software is divided into two main components:

### 1. Firmware (Hardware-side)
- Runs on ESP32-CAM device
- Handles camera control and image capture
- Manages communication with mobile application

### 2. Mobile Application (Software-side)
This repository focuses on the mobile application development, which includes:

- **ESP32 Communication**: Device connection, image frame receiving, command sending
- **Segmentation Pipeline**: Integration with SAM3 instance segmentation model for inference and output handling
- **Navigation Logic**: Processing segmentation results to generate navigation instructions
- **Point-and-Describe Module**: Interactive scene description capability
- **Audio Feedback**: Text-to-speech conversion for user notifications
- **User Interface**: App UI and debugging/visualization tools

## Technology Stack

### Segmentation Model
- **SAM3 (Segment Anything Model 3)** - Facebook Research
  - Repository: https://github.com/facebookresearch/sam3
  - Paper: https://arxiv.org/abs/2511.16719

### Benchmark Project
- OpenAIglasses for Navigation: https://github.com/AI-FanGe/OpenAIglasses_for_Navigation
- Original implementation uses YOLO instance segmentation

## Development Pipeline

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  ESP32-CAM  │────▶│  Mobile App  │────▶│  SAM3 Model     │
│  (Firmware) │◀────│              │◀────│  (Segmentation) │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Navigation  │
                    │    Logic     │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │     TTS      │
                    │    Audio     │
                    └──────────────┘
```

## Team Structure

- **Hardware/Firmware Team**: 2 developers
  - ESP32-CAM firmware development
  - Hardware integration and testing
  
- **Software Team**: 2 developers
  - Mobile application development
  - SAM3 integration and navigation logic

## Getting Started

*(To be added as development progresses)*

## License

*(To be determined)*

## Acknowledgments

- Benchmark project: [OpenAIglasses for Navigation](https://github.com/AI-FanGe/OpenAIglasses_for_Navigation)
- Segmentation model: [SAM3 by Facebook Research](https://github.com/facebookresearch/sam3)
