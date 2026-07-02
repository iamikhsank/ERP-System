// modules/13-hr.gs
function handleHrApi(action, payload) {
  try {
    if (action === 'get') {
      return successResponse(getSheetDataAsObjects('HR'));
    }
    if (action === 'create') {
      const res = insertRow('HR', {
        employeeName: payload.employeeName,
        position: payload.position,
        department: payload.department || 'Operasional',
        status: payload.status || 'Active',
        email: payload.email,
        salary: Number(payload.salary || 0),
        joinDate: payload.joinDate || new Date().toISOString().split('T')[0]
      });
      return successResponse(res);
    }
    if (action === 'update') {
      const res = updateRow('HR', payload.id, {
        employeeName: payload.employeeName,
        position: payload.position,
        department: payload.department,
        status: payload.status,
        email: payload.email,
        salary: Number(payload.salary || 0),
        joinDate: payload.joinDate
      });
      return successResponse(res);
    }
    if (action === 'delete') {
      const res = deleteRow('HR', payload.id);
      return successResponse({ success: res });
    }

    // Attendance (Absensi)
    if (action === 'getAttendance') {
      return successResponse(getSheetDataAsObjects('Attendance'));
    }
    if (action === 'createAttendance') {
      const res = insertRow('Attendance', {
        employeeName: payload.employeeName,
        date: payload.date || new Date().toISOString().split('T')[0],
        status: payload.status || 'Hadir',
        checkIn: payload.checkIn || '',
        checkOut: payload.checkOut || '',
        notes: payload.notes || ''
      });
      return successResponse(res);
    }

    // Leave Requests (Cuti)
    if (action === 'getLeaves') {
      return successResponse(getSheetDataAsObjects('LeaveRequests'));
    }
    if (action === 'createLeave') {
      const res = insertRow('LeaveRequests', {
        employeeName: payload.employeeName,
        startDate: payload.startDate,
        endDate: payload.endDate,
        reason: payload.reason,
        status: 'Pending'
      });
      return successResponse(res);
    }
    if (action === 'approveLeave') {
      const res = updateRow('LeaveRequests', payload.id, { status: 'Approved' });
      return successResponse(res);
    }
    if (action === 'rejectLeave') {
      const res = updateRow('LeaveRequests', payload.id, { status: 'Rejected' });
      return successResponse(res);
    }

    // Payroll Processing
    if (action === 'getPayrolls') {
      return successResponse(getSheetDataAsObjects('Payroll'));
    }
    if (action === 'createPayroll') {
      const res = insertRow('Payroll', {
        employeeName: payload.employeeName,
        month: payload.month,
        basicSalary: Number(payload.basicSalary || 0),
        allowance: Number(payload.allowance || 0),
        deduction: Number(payload.deduction || 0),
        netSalary: Number(payload.basicSalary || 0) + Number(payload.allowance || 0) - Number(payload.deduction || 0),
        status: 'Draft'
      });
      return successResponse(res);
    }
    if (action === 'payPayroll') {
      const allPayrolls = getSheetDataAsObjects('Payroll');
      const foundPay = allPayrolls.find(p => p.id === payload.id);
      if (!foundPay) {
        return errorResponse('Payroll tidak ditemukan');
      }

      // Update Payroll status to Paid
      const res = updateRow('Payroll', payload.id, { status: 'Paid' });

      // Insert transaction to Finance as Expense
      insertRow('Finance', {
        type: 'Expense',
        amount: Number(foundPay.netSalary),
        date: new Date().toISOString().split('T')[0],
        description: 'Pembayaran Gaji Bulanan: ' + foundPay.employeeName + ' (' + foundPay.month + ')',
        category: 'Gaji Karyawan',
        reconciled: 'false',
        bankRef: ''
      });

      return successResponse(res);
    }

    return errorResponse('Action not found: ' + action);
  } catch (err) {
    return errorResponse(err.message);
  }
}
