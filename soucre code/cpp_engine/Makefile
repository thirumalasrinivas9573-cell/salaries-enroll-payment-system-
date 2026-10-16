CXX = clang++
CXXFLAGS = -std=c++17 -Wall -Wextra -O2 -Iinclude

SRC_DIR = src
INC_DIR = include
BIN_DIR = bin
BUILD_DIR = build

SRCS = $(SRC_DIR)/SalaryStructure.cpp \
       $(SRC_DIR)/ContributionRule.cpp \
       $(SRC_DIR)/Overtime.cpp \
       $(SRC_DIR)/Attendance.cpp \
       $(SRC_DIR)/AttendanceRecord.cpp \
       $(SRC_DIR)/SalaryRecord.cpp \
       $(SRC_DIR)/EPFCalculator.cpp \
       $(SRC_DIR)/PFCalculator.cpp \
       $(SRC_DIR)/ESICCalculator.cpp \
       $(SRC_DIR)/Employee.cpp \
       $(SRC_DIR)/PayrollSlip.cpp \
       $(SRC_DIR)/PayrollProcessor.cpp \
       $(SRC_DIR)/ReportGenerator.cpp \
       $(SRC_DIR)/ECRExportFormatter.cpp \
       $(SRC_DIR)/ESICExportFormatter.cpp \
       $(SRC_DIR)/PayrollEngine.cpp \
       $(SRC_DIR)/main.cpp

OBJS = $(SRCS:$(SRC_DIR)/%.cpp=$(BUILD_DIR)/%.o)
TARGET = $(BIN_DIR)/payroll_engine

.PHONY: all clean test run

all: $(TARGET)

$(TARGET): $(OBJS) | $(BIN_DIR)
	@mkdir -p $(BIN_DIR)
	$(CXX) $(CXXFLAGS) -o $@ $(OBJS)
	@echo "✓ Successfully compiled: $(TARGET)"

$(BUILD_DIR)/%.o: $(SRC_DIR)/%.cpp | $(BUILD_DIR)
	@mkdir -p $(BUILD_DIR)
	$(CXX) $(CXXFLAGS) -c $< -o $@

$(BUILD_DIR):
	@mkdir -p $(BUILD_DIR)

$(BIN_DIR):
	@mkdir -p $(BIN_DIR)

test: $(TARGET)
	@./$(TARGET) --test

clean:
	rm -rf $(BUILD_DIR) $(BIN_DIR)
