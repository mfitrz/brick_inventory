FROM python:3.13-slim

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY . .

EXPOSE 80

CMD ["fastapi", "run", "lego_inventory.py", "--host", "0.0.0.0", "--port", "80"]