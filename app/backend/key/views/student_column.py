from django.core import serializers
from ..models import StudentColumn as StudentColumnModel
from ..serializers import StudentColumnSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import time


class StudentColumn(APIView):

    def validateGet(self, request):
        if 'info_id' in request.query_params:
            try:
                StudentColumnModel.objects.get(pk=int(request.query_params['info_id']))
            except Exception as e:
                return False
        return True
      
    def validatePatch(self, request):
        try:
            StudentColumnModel.objects.get(pk=request.data['info_id'])
        except:
            return False
        return True

    # Get existing student data
    def get(self, request):
        if not self.validateGet(request):
            return Response({'error':'Invalid Parameters'}, status='400')
        info = StudentColumnModel.objects.get(pk=int(request.query_params['info_id']))

        serializer = StudentColumnSerializer(info, many=True)
        
        return Response(serializer.data, content_type='application/json')
      
    # Create a new student
    def post(self, request):
        # Note: Until we convert student.id to an autofield/serial, this will require that we create a new student ID for new students.
        # So, for now we'll just assign them the UNIX timestamp, since that should be pretty unique.
        # This approach will break on January 17, 2038, when UNIX timestamps will exceed 32 bits, so we'll probably want to fix this.
        if not 'info_id' in request.data:
            request.data['info_id'] = round(time.time())

        serializer = StudentColumnSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Update an existing student
    def patch(self, request):
        if not self.validatePatch(request):
            return Response({'error':'Invalid Paremeters'}, status='400')

        obj = StudentColumnModel.objects.get(pk=request.data['info_id'])
        serializer = StudentSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
