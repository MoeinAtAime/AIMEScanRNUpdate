// CustomCalendar.js
import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import colors from '../config/colors';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const CustomCalendar = ({
  visible,
  onClose,
  onSelectDate,
  selectedDate,
  scannedDates,
  size = 'medium', // small, medium, large
  theme = 'light', // light, dark
  customStyles = {},
}) => {
  const [currentMonth, setCurrentMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // Reset current month when selected date changes
  useEffect(() => {
    setCurrentMonth(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
    );
  }, [selectedDate]);

  // Responsive calculations
  const isSmallScreen = dimensions.width < 375;
  const isMediumScreen = dimensions.width >= 375 && dimensions.width < 414;
  const isLargeScreen = dimensions.width >= 414;
  const isTablet = dimensions.width >= 768;
  const isLandscape = dimensions.width > dimensions.height;

  // Base scaling function
  const getScaledSize = baseSize => {
    if (isTablet) return baseSize * 1.4;
    if (isSmallScreen) return baseSize * 0.85;
    if (isMediumScreen) return baseSize;
    return baseSize * 1.1;
  };

  // Size configurations
  const sizeConfigs = {
    small: {
      containerWidth: isTablet ? '60%' : '85%',
      containerPadding: getScaledSize(15),
      borderRadius: getScaledSize(15),
      titleSize: getScaledSize(16),
      monthYearSize: getScaledSize(14),
      weekdaySize: getScaledSize(12),
      daySize: getScaledSize(12),
      buttonSize: getScaledSize(14),
      navButtonSize: getScaledSize(18),
      dayItemSize: getScaledSize(32),
      dotSize: getScaledSize(4),
    },
    medium: {
      containerWidth: isTablet ? '70%' : '90%',
      containerPadding: getScaledSize(20),
      borderRadius: getScaledSize(20),
      titleSize: getScaledSize(18),
      monthYearSize: getScaledSize(16),
      weekdaySize: getScaledSize(14),
      daySize: getScaledSize(14),
      buttonSize: getScaledSize(16),
      navButtonSize: getScaledSize(20),
      dayItemSize: getScaledSize(35),
      dotSize: getScaledSize(6),
    },
    large: {
      containerWidth: isTablet ? '80%' : '95%',
      containerPadding: getScaledSize(25),
      borderRadius: getScaledSize(25),
      titleSize: getScaledSize(20),
      monthYearSize: getScaledSize(18),
      weekdaySize: getScaledSize(16),
      daySize: getScaledSize(16),
      buttonSize: getScaledSize(18),
      navButtonSize: getScaledSize(22),
      dayItemSize: getScaledSize(40),
      dotSize: getScaledSize(8),
    },
  };

  const currentConfig = sizeConfigs[size] || sizeConfigs.medium;

  // Theme configurations
  const themes = {
    light: {
      backgroundColor: '#ffffff',
      textColor: '#333333',
      secondaryTextColor: '#666666',
      disabledTextColor: '#cccccc',
      borderColor: '#e0e0e0',
      modalBackgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    dark: {
      backgroundColor: '#2c2c2c',
      textColor: '#ffffff',
      secondaryTextColor: '#cccccc',
      disabledTextColor: '#666666',
      borderColor: '#444444',
      modalBackgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
  };

  const currentTheme = themes[theme] || themes.light;

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const days = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    // Get the number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Add blank spaces for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({day: '', month, year, isCurrentMonth: false});
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({day, month, year, isCurrentMonth: true});
    }

    // Calculate how many days to add to complete the last week
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 0; i < remainingDays; i++) {
        days.push({day: '', month, year, isCurrentMonth: false});
      }
    }

    return days;
  }, [currentMonth]);

  // Check if a day has a scan
  const hasScans = (day, month, year) => {
    if (!day || !scannedDates) return false;

    const dateStr = new Date(year, month, day).toLocaleDateString('en-US');
    return scannedDates[dateStr] === true;
  };

  // Check if a day is the selected date
  const isSelectedDate = (day, month, year) => {
    if (!day) return false;
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  // Check if a day is today
  const isToday = (day, month, year) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const renderCalendarItem = ({item, index}) => {
    const {day, month, year, isCurrentMonth} = item;

    if (!day) {
      return (
        <View
          style={[responsiveStyles.dayItem, {backgroundColor: 'transparent'}]}
        />
      );
    }

    const hasScan = hasScans(day, month, year);
    const isSelected = isSelectedDate(day, month, year);
    const todayFlag = isToday(day, month, year);

    return (
      <TouchableOpacity
        style={[
          responsiveStyles.dayItem,
          isSelected && responsiveStyles.selectedDay,
          todayFlag && !isSelected && responsiveStyles.todayDay,
        ]}
        onPress={() => onSelectDate(new Date(year, month, day))}
        disabled={!isCurrentMonth}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${day} ${MONTHS[month]} ${year}${
          isSelected ? ', selected' : ''
        }${todayFlag ? ', today' : ''}${hasScan ? ', has scan' : ''}`}
        accessibilityState={{selected: isSelected, disabled: !isCurrentMonth}}>
        <Text
          style={[
            responsiveStyles.dayText,
            !isCurrentMonth && responsiveStyles.disabledDay,
            isSelected && responsiveStyles.selectedDayText,
            todayFlag && !isSelected && responsiveStyles.todayDayText,
          ]}>
          {day}
        </Text>
        {hasScan && <View style={responsiveStyles.scanDot} />}
      </TouchableOpacity>
    );
  };

  // Dynamic styles based on screen size, platform, and theme
  const responsiveStyles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: currentTheme.modalBackgroundColor,
      padding: isLandscape ? 10 : 20,
    },
    calendarContainer: {
      width: currentConfig.containerWidth,
      backgroundColor: currentTheme.backgroundColor,
      borderRadius: currentConfig.borderRadius,
      padding: currentConfig.containerPadding,
      maxHeight: isLandscape ? '95%' : '80%',
      minHeight: isTablet ? 500 : 400,
      // Platform-specific shadow
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.25,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: getScaledSize(15),
      position: 'relative',
      minHeight: Platform.OS === 'ios' ? 44 : 48,
    },
    closeButton: {
      position: 'absolute',
      left: 0,
      padding: getScaledSize(8),
      minWidth: Platform.OS === 'ios' ? 44 : 48,
      minHeight: Platform.OS === 'ios' ? 44 : 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: getScaledSize(8),
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    closeButtonText: {
      fontSize: currentConfig.titleSize,
      color: currentTheme.secondaryTextColor,
      fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
      includeFontPadding: false,
    },
    title: {
      fontSize: currentConfig.titleSize,
      fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
      color: currentTheme.textColor,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      includeFontPadding: false,
      textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
    },
    monthNavigation: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: getScaledSize(15),
      paddingHorizontal: getScaledSize(10),
    },
    navButton: {
      padding: getScaledSize(10),
      minWidth: Platform.OS === 'ios' ? 44 : 48,
      minHeight: Platform.OS === 'ios' ? 44 : 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: getScaledSize(8),
      backgroundColor: 'rgba(0, 122, 255, 0.1)',
    },
    navButtonText: {
      fontSize: currentConfig.navButtonSize,
      color: colors.primaryColor || '#007AFF',
      fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
      includeFontPadding: false,
    },
    monthYearText: {
      fontSize: currentConfig.monthYearSize,
      fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
      color: currentTheme.textColor,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
      includeFontPadding: false,
      textAlign: 'center',
      flex: 1,
    },
    weekdaysContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: getScaledSize(10),
      paddingHorizontal: getScaledSize(5),
    },
    weekdayText: {
      fontSize: currentConfig.weekdaySize,
      fontWeight: Platform.OS === 'ios' ? '500' : 'normal',
      color: currentTheme.secondaryTextColor,
      width: `${100 / 7}%`,
      textAlign: 'center',
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
      includeFontPadding: false,
    },
    dayItem: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      minHeight: currentConfig.dayItemSize,
      borderRadius: currentConfig.dayItemSize / 2,
      margin: 1,
    },
    dayText: {
      fontSize: currentConfig.daySize,
      fontWeight: Platform.OS === 'ios' ? '400' : 'normal',
      color: currentTheme.textColor,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      includeFontPadding: false,
      textAlign: 'center',
    },
    disabledDay: {
      color: currentTheme.disabledTextColor,
    },
    selectedDay: {
      backgroundColor: colors.primaryColor || '#007AFF',
      // Platform-specific selected day styling
      ...Platform.select({
        ios: {
          shadowColor: colors.primaryColor || '#007AFF',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    selectedDayText: {
      color: 'white',
      fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    },
    todayDay: {
      borderWidth: 2,
      borderColor: colors.primaryColor || '#007AFF',
    },
    todayDayText: {
      fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
      color: colors.primaryColor || '#007AFF',
    },
    scanDot: {
      position: 'absolute',
      bottom: getScaledSize(3),
      height: currentConfig.dotSize,
      width: currentConfig.dotSize,
      backgroundColor: colors.success || '#4CAF50',
      borderRadius: currentConfig.dotSize / 2,
      // Platform-specific dot styling
      ...Platform.select({
        ios: {
          shadowColor: colors.success || '#4CAF50',
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.5,
          shadowRadius: 2,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    doneButton: {
      backgroundColor: colors.primaryColor || '#007AFF',
      borderRadius: getScaledSize(10),
      padding: getScaledSize(12),
      alignItems: 'center',
      marginTop: getScaledSize(15),
      minHeight: Platform.OS === 'ios' ? 44 : 48,
      justifyContent: 'center',
      // Platform-specific button styling
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    doneButtonText: {
      color: 'white',
      fontSize: currentConfig.buttonSize,
      fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
      includeFontPadding: false,
      textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
      supportedOrientations={['portrait', 'landscape']}>
      <View style={[responsiveStyles.modalContainer, customStyles.modal]}>
        <View
          style={[responsiveStyles.calendarContainer, customStyles.container]}>
          {/* Header */}
          <View style={[responsiveStyles.header, customStyles.header]}>
            <TouchableOpacity
              onPress={onClose}
              style={responsiveStyles.closeButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close calendar">
              <Text style={responsiveStyles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={responsiveStyles.title}>Select Date</Text>
          </View>

          {/* Month Navigation */}
          <View style={responsiveStyles.monthNavigation}>
            <TouchableOpacity
              onPress={previousMonth}
              style={responsiveStyles.navButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Previous month">
              <Text style={responsiveStyles.navButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={responsiveStyles.monthYearText}>
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity
              onPress={nextMonth}
              style={responsiveStyles.navButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Next month">
              <Text style={responsiveStyles.navButtonText}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Days of week header */}
          <View style={responsiveStyles.weekdaysContainer}>
            {DAYS_OF_WEEK.map(day => (
              <Text key={day} style={responsiveStyles.weekdayText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar grid */}
          <FlatList
            data={calendarDays}
            renderItem={renderCalendarItem}
            keyExtractor={(item, index) =>
              `${item.day}-${item.month}-${item.year}-${index}`
            }
            numColumns={7}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingHorizontal: getScaledSize(5)}}
          />

          {/* Done button */}
          <TouchableOpacity
            style={[responsiveStyles.doneButton, customStyles.doneButton]}
            onPress={onClose}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Done selecting date">
            <Text style={responsiveStyles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CustomCalendar;
