// بيانات النظام
let currentStudent = null;
let currentPage = 1;
let currentGroup = 1; // الفوج الحالي
const studentsPerPage = 20;
let filteredStudents = [];

// بيانات افتراضية للتلميذ
const defaultStudentData = {
    name: '',
    attendance: Array(8).fill('not-marked'), // 8 حصص
    payments: Array(10).fill('unpaid') // 10 أشهر
};

// إنشاء بيانات افتراضية لـ 120 تلميذ مقسمين إلى 3 أفواج
function initializeData() {
    const data = JSON.parse(localStorage.getItem('studentListData'));
    if (!data) {
        const initialData = {};
        
        // إنشاء 120 تلميذ مقسمين إلى 3 أفواج (40 تلميذ لكل فوج)
        for (let group = 1; group <= 3; group++) {
            for (let studentInGroup = 1; studentInGroup <= 40; studentInGroup++) {
                const studentId = (group - 1) * 40 + studentInGroup;
                initialData[studentId] = {
                    name: `تلميذ ${studentInGroup} - الفوج ${group}`,
                    group: group,
                    attendance: Array(8).fill('not-marked'),
                    payments: Array(10).fill('unpaid')
                };
            }
        }
        
        localStorage.setItem('studentListData', JSON.stringify(initialData));
        return initialData;
    }
    return data;
}

// حفظ البيانات
function saveData(data) {
    localStorage.setItem('studentListData', JSON.stringify(data));
    autoBackup();
}

// جلب البيانات
function getData() {
    return JSON.parse(localStorage.getItem('studentListData')) || initializeData();
}

// جلب بيانات فوج معين
function getGroupData(groupNumber) {
    const data = getData();
    const groupData = {};
    
    for (let studentId = 1; studentId <= 120; studentId++) {
        const student = data[studentId];
        if (student && student.group === groupNumber) {
            groupData[studentId] = student;
        }
    }
    
    return groupData;
}

// عرض لوحة التحكم
function showDashboard() {
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('listView').classList.add('hidden');
    document.getElementById('studentDetails').classList.add('hidden');
    
    updateDashboardStats();
}

// عرض جميع التلاميذ
function showAllStudents() {
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('listView').classList.remove('hidden');
    document.getElementById('studentDetails').classList.add('hidden');
    
    currentPage = 1;
    displayStudentsList();
}

// عرض فوج معين
function showGroup(groupNumber) {
    currentGroup = groupNumber;
    showAllStudents();
}

// تحديث إحصائيات لوحة التحكم
function updateDashboardStats() {
    const data = getData();
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalSessions = 0;
    let totalPaid = 0;
    let totalPayments = 0;
    let presentToday = 0;
    
    // إحصائيات لكل فوج
    let groupStats = {
        1: { present: 0, absent: 0, late: 0, paid: 0, unpaid: 0 },
        2: { present: 0, absent: 0, late: 0, paid: 0, unpaid: 0 },
        3: { present: 0, absent: 0, late: 0, paid: 0, unpaid: 0 }
    };
    
    // حساب الإحصائيات
    for (let studentId = 1; studentId <= 120; studentId++) {
        const student = data[studentId];
        if (!student) continue;
        
        const group = student.group || 1;
        
        // حساب الحضور
        student.attendance.forEach((status, index) => {
            if (status === 'present') {
                totalPresent++;
                groupStats[group].present++;
                if (index === 0) presentToday++; // الحصة الأولى كمثال لليوم
            }
            else if (status === 'absent') {
                totalAbsent++;
                groupStats[group].absent++;
            }
            else if (status === 'late') {
                totalLate++;
                groupStats[group].late++;
            }
            if (status !== 'not-marked') totalSessions++;
        });
        
        // حساب الدفعات
        student.payments.forEach(status => {
            if (status === 'paid') {
                totalPaid++;
                groupStats[group].paid++;
            } else {
                groupStats[group].unpaid++;
            }
            totalPayments++;
        });
    }
    
    // تحديث العرض
    document.getElementById('totalStudents').textContent = 120;
    document.getElementById('attendanceRate').textContent = 
        totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) + '%' : '0%';
    document.getElementById('paymentRate').textContent = 
        totalPayments > 0 ? Math.round((totalPaid / totalPayments) * 100) + '%' : '0%';
    document.getElementById('presentToday').textContent = presentToday;
    
    // تحديث إحصائيات الأفواج
    updateGroupStats(groupStats);
}

// تحديث إحصائيات الأفواج
function updateGroupStats(groupStats) {
    for (let group = 1; group <= 3; group++) {
        const stats = groupStats[group];
        const totalSessions = stats.present + stats.absent + stats.late;
        const attendanceRate = totalSessions > 0 ? Math.round((stats.present / totalSessions) * 100) : 0;
        const totalPayments = stats.paid + stats.unpaid;
        const paymentRate = totalPayments > 0 ? Math.round((stats.paid / totalPayments) * 100) : 0;
        
        document.getElementById(`group${group}Students`).textContent = 40;
        document.getElementById(`group${group}Attendance`).textContent = attendanceRate + '%';
        document.getElementById(`group${group}Payment`).textContent = paymentRate + '%';
    }
}

// عرض قائمة التلاميذ مع التصفح بالصفحات
function displayStudentsList() {
    const data = getData();
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const monthFilter = document.getElementById('monthFilter').value;
    const attendanceFilter = document.getElementById('attendanceFilter').value;
    const groupFilter = document.getElementById('groupFilter').value;
    
    // فلترة البيانات
    filteredStudents = [];
    for (let studentId = 1; studentId <= 120; studentId++) {
        const student = data[studentId];
        if (!student) continue;
        
        // فلترة الفوج
        if (groupFilter && student.group !== parseInt(groupFilter)) {
            continue;
        }
        
        // فلترة البحث
        if (searchTerm && !student.name.toLowerCase().includes(searchTerm)) {
            continue;
        }
        
        // فلترة الحضور
        if (attendanceFilter) {
            const hasStatus = student.attendance.some(status => status === attendanceFilter);
            if (!hasStatus) continue;
        }
        
        filteredStudents.push({ id: studentId, ...student });
    }
    
    // حساب التصفح
    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
    const startIndex = (currentPage - 1) * studentsPerPage;
    const endIndex = startIndex + studentsPerPage;
    const currentStudents = filteredStudents.slice(startIndex, endIndex);
    
    // تحديث معلومات التصفح
    updatePaginationInfo(startIndex + 1, Math.min(endIndex, filteredStudents.length), filteredStudents.length, currentPage, totalPages);
    
    // تحديث عنوان القائمة
    const groupFilterValue = document.getElementById('groupFilter').value;
    let title = 'قائمة التلاميذ (120 تلميذ)';
    if (groupFilterValue) {
        const groupStudents = filteredStudents.length;
        title = `الفوج ${groupFilterValue} (${groupStudents} تلميذ)`;
    }
    document.getElementById('listTitle').textContent = title;
    
    // عرض البيانات
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = '';
    
    currentStudents.forEach(student => {
        const row = createStudentRow(student.id, student);
        tbody.appendChild(row);
    });
}

// تحديث معلومات التصفح
function updatePaginationInfo(start, end, total, page, totalPages) {
    document.getElementById('paginationInfo').textContent = `عرض ${start}-${end} من ${total} تلميذ`;
    document.getElementById('pageInfo').textContent = `صفحة ${page} من ${totalPages}`;
    document.getElementById('pageInfoBottom').textContent = `صفحة ${page} من ${totalPages}`;
    
    // تحديث أزرار التصفح
    const prevBtns = ['prevBtn', 'prevBtnBottom'];
    const nextBtns = ['nextBtn', 'nextBtnBottom'];
    
    prevBtns.forEach(id => {
        document.getElementById(id).disabled = page === 1;
    });
    
    nextBtns.forEach(id => {
        document.getElementById(id).disabled = page === totalPages || totalPages === 0;
    });
}

// الصفحة التالية
function nextPage() {
    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayStudentsList();
    }
}

// الصفحة السابقة
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayStudentsList();
    }
}

// إنشاء صف تلميذ
function createStudentRow(studentId, student) {
    const row = document.createElement('tr');
    
    // الرقم
    const numberCell = document.createElement('td');
    numberCell.textContent = studentId;
    row.appendChild(numberCell);
    
    // الفوج
    const groupCell = document.createElement('td');
    const groupBadge = document.createElement('span');
    groupBadge.className = `group-badge group-${student.group}`;
    groupBadge.textContent = `الفوج ${student.group}`;
    groupCell.appendChild(groupBadge);
    row.appendChild(groupCell);
    
    // الاسم
    const nameCell = document.createElement('td');
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = student.name;
    nameInput.className = 'name-input';
    nameInput.addEventListener('change', () => updateStudentName(studentId, nameInput.value));
    nameCell.appendChild(nameInput);
    row.appendChild(nameCell);
    
    // الحضور
    const attendanceCell = document.createElement('td');
    const attendanceBadges = document.createElement('div');
    attendanceBadges.className = 'attendance-badges';
    
    student.attendance.forEach((status, sessionIndex) => {
        const badge = document.createElement('div');
        badge.className = `attendance-badge ${status}`;
        badge.textContent = sessionIndex + 1;
        badge.title = `الحصة ${sessionIndex + 1} - ${getAttendanceStatusText(status)}`;
        badge.addEventListener('click', () => toggleAttendance(studentId, sessionIndex));
        attendanceBadges.appendChild(badge);
    });
    
    attendanceCell.appendChild(attendanceBadges);
    row.appendChild(attendanceCell);
    
    // الدفعات
    const paymentsCell = document.createElement('td');
    const paymentBadges = document.createElement('div');
    paymentBadges.className = 'payment-badges';
    
    student.payments.forEach((status, monthIndex) => {
        const badge = document.createElement('div');
        badge.className = `payment-badge ${status}`;
        badge.textContent = monthIndex + 1;
        badge.title = `الشهر ${monthIndex + 1} - ${getPaymentStatusText(status)}`;
        badge.addEventListener('click', () => togglePayment(studentId, monthIndex));
        paymentBadges.appendChild(badge);
    });
    
    paymentsCell.appendChild(paymentBadges);
    row.appendChild(paymentsCell);
    
    // الإجراءات
    const actionsCell = document.createElement('td');
    const detailsBtn = document.createElement('button');
    detailsBtn.className = 'btn btn-primary btn-sm';
    detailsBtn.innerHTML = '<i class="fas fa-eye"></i> التفاصيل';
    detailsBtn.addEventListener('click', () => showStudentDetails(studentId));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-sm';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = 'حذف التلميذ';
    deleteBtn.addEventListener('click', () => deleteStudent(studentId));
    
    actionsCell.appendChild(detailsBtn);
    actionsCell.appendChild(deleteBtn);
    row.appendChild(actionsCell);
    
    return row;
}

// تحديث اسم التلميذ
function updateStudentName(studentId, newName) {
    const data = getData();
    if (data[studentId]) {
        data[studentId].name = newName;
        saveData(data);
    }
}

// تبديل حالة الحضور
function toggleAttendance(studentId, sessionIndex) {
    const data = getData();
    if (!data[studentId]) return;
    
    const currentStatus = data[studentId].attendance[sessionIndex];
    
    let newStatus;
    switch (currentStatus) {
        case 'not-marked':
            newStatus = 'present';
            break;
        case 'present':
            newStatus = 'late';
            break;
        case 'late':
            newStatus = 'absent';
            break;
        case 'absent':
            newStatus = 'not-marked';
            break;
        default:
            newStatus = 'present';
    }
    
    data[studentId].attendance[sessionIndex] = newStatus;
    saveData(data);
    displayStudentsList();
    updateDashboardStats();
}

// تبديل حالة الدفع
function togglePayment(studentId, monthIndex) {
    const data = getData();
    if (!data[studentId]) return;
    
    const currentStatus = data[studentId].payments[monthIndex];
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    
    data[studentId].payments[monthIndex] = newStatus;
    saveData(data);
    displayStudentsList();
    updateDashboardStats();
}

// عرض تفاصيل التلميذ
function showStudentDetails(studentId) {
    currentStudent = studentId;
    const data = getData();
    const student = data[studentId];
    
    if (!student) return;
    
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('listView').classList.add('hidden');
    document.getElementById('studentDetails').classList.remove('hidden');
    
    document.getElementById('studentName').textContent = `تفاصيل ${student.name}`;
    
    displayAttendanceDetails(student);
    displayPaymentDetails(student);
    updateStudentSummary(student);
}

// عرض تفاصيل الحضور
function displayAttendanceDetails(student) {
    const container = document.getElementById('attendanceGrid');
    container.innerHTML = '';
    
    student.attendance.forEach((status, index) => {
        const item = document.createElement('div');
        item.className = `attendance-item ${status}`;
        item.innerHTML = `
            <h4>الحصة ${index + 1}</h4>
            <p>${getAttendanceStatusText(status)}</p>
        `;
        item.addEventListener('click', () => {
            toggleAttendance(currentStudent, index);
            const updatedStudent = getData()[currentStudent];
            displayAttendanceDetails(updatedStudent);
            updateStudentSummary(updatedStudent);
        });
        container.appendChild(item);
    });
}

// عرض تفاصيل الدفعات
function displayPaymentDetails(student) {
    const container = document.getElementById('paymentsGrid');
    container.innerHTML = '';
    
    student.payments.forEach((status, index) => {
        const item = document.createElement('div');
        item.className = `payment-item ${status}`;
        item.innerHTML = `
            <h4>الشهر ${index + 1}</h4>
            <p class="payment-status">${getPaymentStatusText(status)}</p>
        `;
        item.addEventListener('click', () => {
            togglePayment(currentStudent, index);
            const updatedStudent = getData()[currentStudent];
            displayPaymentDetails(updatedStudent);
            updateStudentSummary(updatedStudent);
        });
        container.appendChild(item);
    });
}

// تحديث ملخص التلميذ
function updateStudentSummary(student) {
    let present = 0, absent = 0, late = 0, paid = 0, unpaid = 0;
    
    student.attendance.forEach(status => {
        if (status === 'present') present++;
        else if (status === 'absent') absent++;
        else if (status === 'late') late++;
    });
    
    student.payments.forEach(status => {
        if (status === 'paid') paid++;
        else if (status === 'unpaid') unpaid++;
    });
    
    document.getElementById('totalPresent').textContent = present;
    document.getElementById('totalAbsent').textContent = absent;
    document.getElementById('totalLate').textContent = late;
    document.getElementById('totalPaid').textContent = paid;
    document.getElementById('totalUnpaid').textContent = unpaid;
}

// الحصول على نص حالة الحضور
function getAttendanceStatusText(status) {
    switch (status) {
        case 'present': return 'حاضر';
        case 'absent': return 'غائب';
        case 'late': return 'متأخر';
        case 'not-marked': return 'غير محدد';
        default: return 'غير محدد';
    }
}

// الحصول على نص حالة الدفع
function getPaymentStatusText(status) {
    switch (status) {
        case 'paid': return 'مدفوع';
        case 'unpaid': return 'غير مدفوع';
        default: return 'غير محدد';
    }
}

// العودة للقائمة
function goBackToList() {
    document.getElementById('studentDetails').classList.add('hidden');
    document.getElementById('listView').classList.remove('hidden');
    displayStudentsList();
}

// البحث في التلاميذ
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const monthFilter = document.getElementById('monthFilter');
    const attendanceFilter = document.getElementById('attendanceFilter');
    const groupFilter = document.getElementById('groupFilter');
    
    searchInput.addEventListener('input', () => {
        currentPage = 1;
        displayStudentsList();
    });
    
    monthFilter.addEventListener('change', () => {
        currentPage = 1;
        displayStudentsList();
    });
    
    attendanceFilter.addEventListener('change', () => {
        currentPage = 1;
        displayStudentsList();
    });
    
    groupFilter.addEventListener('change', () => {
        currentPage = 1;
        displayStudentsList();
    });
}

// عرض الإحصائيات
function showStatistics() {
    const data = getData();
    let stats = {
        totalStudents: 120,
        totalPresent: 0,
        totalAbsent: 0,
        totalLate: 0,
        totalPaid: 0,
        totalUnpaid: 0,
        attendanceBySession: Array(8).fill(0),
        paymentsByMonth: Array(10).fill(0),
        groupStats: {
            1: { students: 40, present: 0, absent: 0, late: 0, paid: 0, unpaid: 0 },
            2: { students: 40, present: 0, absent: 0, late: 0, paid: 0, unpaid: 0 },
            3: { students: 40, present: 0, absent: 0, late: 0, paid: 0, unpaid: 0 }
        }
    };
    
    // حساب الإحصائيات الشاملة
    for (let studentId = 1; studentId <= 120; studentId++) {
        const student = data[studentId];
        if (!student) continue;
        
        const group = student.group || 1;
        
        student.attendance.forEach((status, index) => {
            if (status === 'present') {
                stats.totalPresent++;
                stats.attendanceBySession[index]++;
                stats.groupStats[group].present++;
            }
            else if (status === 'absent') {
                stats.totalAbsent++;
                stats.groupStats[group].absent++;
            }
            else if (status === 'late') {
                stats.totalLate++;
                stats.groupStats[group].late++;
            }
        });
        
        student.payments.forEach((status, index) => {
            if (status === 'paid') {
                stats.totalPaid++;
                stats.paymentsByMonth[index]++;
                stats.groupStats[group].paid++;
            }
            else if (status === 'unpaid') {
                stats.totalUnpaid++;
                stats.groupStats[group].unpaid++;
            }
        });
    }
    
    const attendanceRate = stats.totalPresent + stats.totalAbsent + stats.totalLate > 0 
        ? Math.round((stats.totalPresent / (stats.totalPresent + stats.totalAbsent + stats.totalLate)) * 100) 
        : 0;
    
    const paymentRate = stats.totalPaid + stats.totalUnpaid > 0 
        ? Math.round((stats.totalPaid / (stats.totalPaid + stats.totalUnpaid)) * 100) 
        : 0;
    
    let groupStatsText = '';
    for (let group = 1; group <= 3; group++) {
        const groupStat = stats.groupStats[group];
        const groupAttendanceTotal = groupStat.present + groupStat.absent + groupStat.late;
        const groupAttendanceRate = groupAttendanceTotal > 0 ? Math.round((groupStat.present / groupAttendanceTotal) * 100) : 0;
        const groupPaymentTotal = groupStat.paid + groupStat.unpaid;
        const groupPaymentRate = groupPaymentTotal > 0 ? Math.round((groupStat.paid / groupPaymentTotal) * 100) : 0;
        
        groupStatsText += `\nالفوج ${group}:
  - عدد التلاميذ: ${groupStat.students}
  - معدل الحضور: ${groupAttendanceRate}%
  - معدل الدفع: ${groupPaymentRate}%`;
    }
    
    alert(`إحصائيات شاملة:
إجمالي التلاميذ: ${stats.totalStudents} (3 أفواج × 40 تلميذ)
إجمالي الحضور: ${stats.totalPresent}
إجمالي الغياب: ${stats.totalAbsent}
إجمالي التأخير: ${stats.totalLate}
معدل الحضور العام: ${attendanceRate}%
إجمالي المدفوعات: ${stats.totalPaid}
إجمالي غير المدفوع: ${stats.totalUnpaid}
معدل الدفع العام: ${paymentRate}%
${groupStatsText}`);
}

// تصدير البيانات
function exportData() {
    const data = getData();
    const exportData = {
        timestamp: new Date().toISOString(),
        totalStudents: 120,
        groups: 3,
        studentsPerGroup: 40,
        students: data
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// تصدير إلى CSV
function exportToCSV() {
    const data = getData();
    let csv = 'الرقم,الفوج,الاسم,الحضور_الحصة_1,الحضور_الحصة_2,الحضور_الحصة_3,الحضور_الحصة_4,الحضور_الحصة_5,الحضور_الحصة_6,الحضور_الحصة_7,الحضور_الحصة_8,الدفع_الشهر_1,الدفع_الشهر_2,الدفع_الشهر_3,الدفع_الشهر_4,الدفع_الشهر_5,الدفع_الشهر_6,الدفع_الشهر_7,الدفع_الشهر_8,الدفع_الشهر_9,الدفع_الشهر_10\n';
    
    for (let studentId = 1; studentId <= 120; studentId++) {
        const student = data[studentId];
        if (!student) continue;
        
        const attendanceStr = student.attendance.join(',');
        const paymentsStr = student.payments.join(',');
        csv += `${studentId},${student.group || 1},"${student.name}",${attendanceStr},${paymentsStr}\n`;
    }
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_list_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// طباعة القائمة
function printList() {
    const data = getData();
    let printContent = `
        <html>
        <head>
            <title>قائمة التلاميذ</title>
            <style>
                body { font-family: Arial, sans-serif; direction: rtl; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                th { background-color: #f2f2f2; }
                .group-header { background-color: #e3f2fd; font-weight: bold; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <h1>قائمة التلاميذ - 120 تلميذ مقسمين إلى 3 أفواج</h1>
    `;
    
    for (let group = 1; group <= 3; group++) {
        printContent += `
            <h2>الفوج ${group} (40 تلميذ)</h2>
            <table>
                <thead>
                    <tr>
                        <th>الرقم</th>
                        <th>الاسم</th>
                        <th>الحضور</th>
                        <th>الدفعات</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        for (let studentId = 1; studentId <= 120; studentId++) {
            const student = data[studentId];
            if (!student || student.group !== group) continue;
            
            const presentCount = student.attendance.filter(s => s === 'present').length;
            const paidCount = student.payments.filter(s => s === 'paid').length;
            
            printContent += `
                <tr>
                    <td>${studentId}</td>
                    <td>${student.name}</td>
                    <td>${presentCount}/8</td>
                    <td>${paidCount}/10</td>
                </tr>
            `;
        }
        
        printContent += '</tbody></table>';
    }
    
    printContent += '</body></html>';
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

// تسجيل حضور الجميع
function markAllPresent() {
    if (!confirm('هل تريد تسجيل حضور جميع التلاميذ للحصة الأولى؟')) return;
    
    const data = getData();
    for (let studentId = 1; studentId <= 120; studentId++) {
        if (data[studentId]) {
            data[studentId].attendance[0] = 'present';
        }
    }
    
    saveData(data);
    displayStudentsList();
    updateDashboardStats();
    alert('تم تسجيل حضور جميع التلاميذ للحصة الأولى');
}

// عرض التلاميذ غير المدفوعين
function showUnpaidStudents() {
    document.getElementById('attendanceFilter').value = '';
    document.getElementById('monthFilter').value = '';
    document.getElementById('searchInput').value = '';
    
    // فلترة التلاميذ الذين لديهم دفعات غير مدفوعة
    const data = getData();
    const unpaidStudents = [];
    
    for (let studentId = 1; studentId <= 120; studentId++) {
        const student = data[studentId];
        if (!student) continue;
        
        const hasUnpaid = student.payments.some(status => status === 'unpaid');
        if (hasUnpaid) {
            unpaidStudents.push(student.name);
        }
    }
    
    if (unpaidStudents.length === 0) {
        alert('جميع التلاميذ قاموا بدفع جميع المستحقات');
    } else {
        alert(`التلاميذ الذين لديهم مستحقات غير مدفوعة (${unpaidStudents.length} تلميذ):\n\n${unpaidStudents.join('\n')}`);
    }
}

// إضافة تلميذ جديد
function addNewStudent() {
    alert('النظام مصمم لـ 120 تلميذ مقسمين إلى 3 أفواج (40 تلميذ لكل فوج). لإضافة تلاميذ جدد، يرجى تعديل الكود.');
}

// حذف تلميذ
function deleteStudent(studentId) {
    if (!confirm('هل تريد حذف هذا التلميذ؟')) return;
    
    const data = getData();
    if (data[studentId]) {
        data[studentId] = {
            name: `تلميذ محذوف ${studentId}`,
            group: data[studentId].group,
            attendance: Array(8).fill('not-marked'),
            payments: Array(10).fill('unpaid')
        };
        saveData(data);
        displayStudentsList();
        updateDashboardStats();
    }
}

// حذف التلميذ الحالي
function deleteCurrentStudent() {
    if (currentStudent) {
        deleteStudent(currentStudent);
        goBackToList();
    }
}

// النسخ الاحتياطي التلقائي
function autoBackup() {
    const data = getData();
    const backup = {
        timestamp: new Date().toISOString(),
        data: data
    };
    localStorage.setItem('studentListBackup', JSON.stringify(backup));
}

// استعادة النسخة الاحتياطية
function restoreBackup() {
    const backup = localStorage.getItem('studentListBackup');
    if (backup) {
        const backupData = JSON.parse(backup);
        if (confirm(`هل تريد استعادة النسخة الاحتياطية من ${new Date(backupData.timestamp).toLocaleString('ar')}؟`)) {
            localStorage.setItem('studentListData', JSON.stringify(backupData.data));
            location.reload();
        }
    } else {
        alert('لا توجد نسخة احتياطية متاحة');
    }
}

// تهيئة التطبيق
function initializeApp() {
    initializeData();
    setupSearch();
    showDashboard();
}

// تشغيل التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initializeApp);

